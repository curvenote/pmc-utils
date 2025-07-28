import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import { create as createTar } from 'tar';
import Client from 'ssh2-sftp-client';
import pLimit from 'p-limit';
import { preparePMCManifestText } from 'pmc-node-utils';
import { AAMDepositManifestSchema, pmcXmlFromManifest, type AAMDepositManifest } from 'pmc-utils';
import {
  hyphenatedFromDate,
  removeFolder,
  respondBadRequest,
  respondUnableToProcess,
} from './utils.js';

type Attributes = {
  manifest: AAMDepositManifest;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
};

export function createService() {
  const app = express();
  app.use(express.json());

  app.get('/', async (_, res) => {
    return res.sendStatus(200);
  });

  app.post('/', async (req, res) => {
    if (!req.body) return respondBadRequest(res, 'no message received');
    const { body } = req;

    const { message } = body;
    if (!message) return respondBadRequest(res, 'invalid message format');
    const tmpFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'ftp'));
    let id: string | undefined;
    try {
      const { attributes } = message;
      console.log('Received message', attributes);

      const { manifest: maybeManifest } = (attributes ?? {}) as Attributes;

      const result = AAMDepositManifestSchema.safeParse(maybeManifest);
      console.log('Parsed manifest', result);

      if (result.error) {
        throw new Error(`Invalid manifest: ${result.error.message}`);
      }

      const manifest: AAMDepositManifest = result.data;
      id = manifest.taskId;
      console.log('Task ID', id);

      removeFolder(tmpFolder);
      await fs.mkdir(tmpFolder, { recursive: true });

      const limit = pLimit(5);
      await Promise.all(
        manifest.files.map((file) =>
          limit(async () => {
            const fileResp = await fetch(file.path);
            if (!fileResp.ok) {
              throw new Error(`Unable to download file: ${file.path}`);
            }
            console.log('Downloading file - have response', file.filename);
            // Use arrayBuffer() to handle both text and binary files properly
            const buffer = Buffer.from(await fileResp.arrayBuffer());
            await fs.writeFile(path.join(tmpFolder, file.filename), buffer);
            console.log('Downloaded file - written', file.filename);
          }),
        ),
      );
      console.log('Downloaded all files');
      const manifestText = preparePMCManifestText(manifest);
      console.log('Prepared manifest text');
      await fs.writeFile(path.join(tmpFolder, 'manifest.txt'), manifestText);
      console.log('Wrote manifest text');

      const xml = pmcXmlFromManifest(manifest);
      console.log('Wrote bulk_meta.xml');
      await fs.writeFile(path.join(tmpFolder, 'bulk_meta.xml'), xml);
      console.log('Wrote bulk_meta.xml');

      const tarFileName = `${id}.tar.gz`;
      const tarFilePath = path.join(tmpFolder, tarFileName);
      console.log('Created tar file path', tarFilePath);
      try {
        await createTar({ gzip: true, file: tarFilePath, cwd: tmpFolder }, [
          'manifest.txt',
          'bulk_meta.xml',
          ...manifest.files.map(({ filename }) => filename),
        ]);
        console.log('Created tar file');
      } catch (e) {
        console.error('Error creating tar.gz file', e);
        throw new Error('Error creating tar.gz file');
      }

      const client = new Client();
      console.log('Connecting to FTP server');
      await client.connect({
        host: process.env.FTP_HOST,
        port: parseInt(process.env.FTP_PORT ?? '22'),
        username: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
      });
      console.log('Connected to FTP server');
      const targetDir = `upload/${hyphenatedFromDate(new Date())}`;
      console.log('Checking if target directory exists', targetDir);
      const dirExists = await client.exists(targetDir);
      if (!dirExists) {
        console.log('Creating target directory', targetDir);
        await client.mkdir(targetDir);
        console.log('Created target directory', targetDir);
      } else {
        console.log('Target directory already exists', targetDir);
      }
      await client.put(tarFilePath, `${targetDir}/${tarFileName}`);
      console.log('Uploaded tar file');
      await client.end();
      console.log('Disconnected from FTP server');
      removeFolder(tmpFolder);
      console.log('Removed temporary folder');
      return res.sendStatus(201);
    } catch (err: any) {
      console.error(err);
      removeFolder(tmpFolder);
      return respondUnableToProcess(res, id);
    }
  });

  return app;
}
