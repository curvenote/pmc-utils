import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import { create as createTar } from 'tar';
import Client from 'ssh2-sftp-client';
import { preparePMCManifestText } from '@curvenote/pmc-node';
import {
  AAMDepositManifestSchema,
  pmcXmlFromManifest,
  type AAMDepositManifest,
} from '@curvenote/pmc-web';
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

      const { manifest: maybeManifest } = (attributes ?? {}) as Attributes;

      const result = AAMDepositManifestSchema.safeParse(maybeManifest);

      if (result.error) {
        throw new Error(`Invalid manifest: ${result.error.message}`);
      }

      const manifest: AAMDepositManifest = result.data;
      id = manifest.taskId;

      removeFolder(tmpFolder);
      await fs.mkdir(tmpFolder, { recursive: true });

      await Promise.all(
        manifest.files.map(async (file) => {
          const fileResp = await fetch(file.path);
          if (!fileResp.ok) {
            throw new Error(`Unable to download file: ${file.path}`);
          }
          await fs.writeFile(path.join(tmpFolder, file.filename), await fileResp.text());
        }),
      );
      const manifestText = preparePMCManifestText(manifest);
      await fs.writeFile(path.join(tmpFolder, 'manifest.txt'), manifestText);

      const xml = pmcXmlFromManifest(manifest);
      await fs.writeFile(path.join(tmpFolder, 'bulk_meta.xml'), xml);

      const tarFileName = `${id}.tar.gz`;
      const tarFilePath = path.join(tmpFolder, tarFileName);
      try {
        await createTar({ gzip: true, file: tarFilePath, cwd: tmpFolder }, [
          'manifest.txt',
          'bulk_meta.xml',
          ...manifest.files.map(({ filename }) => filename),
        ]);
      } catch (e) {
        throw new Error('Error creating tar.gz file');
      }
      const client = new Client();
      await client.connect({
        host: process.env.FTP_HOST,
        username: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
      });
      const targetDir = `upload/${hyphenatedFromDate(new Date())}`;
      await client.mkdir(targetDir);
      await client.put(tarFilePath, `${targetDir}/${tarFileName}`);
      await client.end();
      removeFolder(tmpFolder);
      return res.sendStatus(201);
    } catch (err: any) {
      console.error(err);
      removeFolder(tmpFolder);
      return respondUnableToProcess(res, id);
    }
  });

  return app;
}
