/**
 * FTP Service for PMC Manuscript Deposits
 *
 * This service handles the processing and upload of manuscript deposits to PMC (PubMed Central).
 * It downloads files from cloud storage, creates manifest files, generates XML metadata,
 * packages everything into a tar.gz archive, and uploads to an SFTP server.
 *
 * Key Features:
 * - Streaming file downloads for memory efficiency with large files
 * - Concurrent download processing with rate limiting
 * - Automatic manifest and XML generation
 * - SFTP upload with directory management
 * - Comprehensive error handling and cleanup
 */

import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
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

/**
 * Message attributes structure expected from the pub/sub system
 */
type Attributes = {
  manifest: AAMDepositManifest;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
};

/**
 * Creates and configures the Express service for handling PMC deposit requests
 *
 * @returns Express application instance
 */
export function createService() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/', async (_, res) => {
    return res.sendStatus(200);
  });

  /**
   * Main endpoint for processing PMC deposit requests
   *
   * Workflow:
   * 1. Validate incoming manifest data
   * 2. Create temporary workspace
   * 3. Download all files using streaming for memory efficiency
   * 4. Generate PMC manifest and XML metadata
   * 5. Create tar.gz archive
   * 6. Upload to SFTP server
   * 7. Cleanup temporary files
   */
  app.post('/', async (req, res) => {
    if (!req.body) return respondBadRequest(res, 'no message received');
    const { body } = req;

    const { message } = body;
    if (!message) return respondBadRequest(res, 'invalid message format');

    // Create temporary folder for processing files
    const tmpFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'ftp'));
    let id: string | undefined;

    try {
      const { attributes } = message;
      console.log('Received message', attributes);

      // Extract and validate the manifest data
      const { manifest: maybeManifest } = (attributes ?? {}) as Attributes;
      const result = AAMDepositManifestSchema.safeParse(maybeManifest);
      console.log('Parsed manifest', result);

      if (result.error) {
        throw new Error(`Invalid manifest: ${result.error.message}`);
      }

      const manifest: AAMDepositManifest = result.data;
      id = manifest.taskId;
      console.log('Task ID', id);

      // Clean and recreate temporary folder
      removeFolder(tmpFolder);
      await fs.mkdir(tmpFolder, { recursive: true });

      /**
       * STREAMING FILE DOWNLOADS
       *
       * This section handles downloading files from cloud storage using streaming
       * to efficiently handle large files without loading them entirely into memory.
       *
       * Key benefits:
       * - Memory usage stays constant (~256KB) regardless of file size
       * - Can handle multi-GB files without memory exhaustion
       * - Proper backpressure handling prevents overwhelming the system
       * - Concurrent downloads with rate limiting (max 5 simultaneous)
       *
       * Technical details:
       * - Uses Node.js streams with pipeline() for proper error handling
       * - Configurable buffer size via STREAM_BUFFER_KB environment variable
       * - Default 256KB buffer balances memory usage vs performance
       * - Works with both text and binary files automatically
       */

      // Rate limiter: Allow maximum 5 concurrent downloads to prevent overwhelming
      // the source server or network connection
      const limit = pLimit(5);

      await Promise.all(
        manifest.files.map((file) =>
          limit(async () => {
            console.log(`Starting download: ${file.filename} from ${file.path}`);

            // Fetch file from cloud storage (could be Google Cloud Storage, AWS S3, etc.)
            const fileResp = await fetch(file.path);
            if (!fileResp.ok) {
              throw new Error(`Unable to download file: ${file.path} (HTTP ${fileResp.status})`);
            }
            console.log('Downloading file - have response', file.filename);

            /**
             * STREAMING SETUP
             *
             * Instead of loading the entire file into memory with .arrayBuffer() or .text(),
             * we stream the response directly to disk. This approach:
             *
             * 1. Uses a configurable buffer size (default 256KB)
             * 2. Handles backpressure automatically
             * 3. Provides proper error handling and cleanup
             * 4. Works with files of any size (MB to GB+)
             *
             * Buffer size can be tuned via STREAM_BUFFER_KB environment variable:
             * - 64KB: Memory-constrained environments, small files
             * - 256KB: Balanced default for most use cases
             * - 512KB-1MB: High-performance storage, large files
             */

            // Stream the file directly to disk to handle large files efficiently
            const filePath = path.join(tmpFolder, file.filename);

            // Configure write stream with optimized buffer size
            // Buffer size affects memory usage vs performance tradeoff
            const bufferSize = parseInt(process.env.STREAM_BUFFER_KB ?? '256') * 1024;
            const writeStream = createWriteStream(filePath, {
              highWaterMark: bufferSize, // Controls internal buffer size
            });

            // Ensure response has a body stream (should always be present for successful responses)
            if (!fileResp.body) {
              throw new Error(`No response body for file: ${file.path}`);
            }

            /**
             * PIPELINE STREAMING
             *
             * pipeline() connects the HTTP response stream to the file write stream.
             * Benefits over manual stream handling:
             * - Automatic error propagation and cleanup
             * - Proper backpressure handling (slows down reading if writing is slow)
             * - Automatic stream closure on completion or error
             * - Promise-based API for easy async/await usage
             *
             * The pipeline will:
             * 1. Read data from fileResp.body in chunks
             * 2. Write chunks to disk via writeStream
             * 3. Handle any errors by closing both streams
             * 4. Resolve when transfer is complete
             */
            await pipeline(fileResp.body, writeStream);
            console.log(`Downloaded file - written: ${file.filename}`);
          }),
        ),
      );
      console.log('Downloaded all files');

      /**
       * MANIFEST AND METADATA GENERATION
       *
       * After all files are downloaded, generate the required PMC submission files:
       * 1. manifest.txt - Tab-delimited file listing all contents
       * 2. bulk_meta.xml - XML metadata file with manuscript details
       */

      // Generate PMC-compliant manifest text file
      const manifestText = preparePMCManifestText(manifest);
      console.log('Prepared manifest text');
      await fs.writeFile(path.join(tmpFolder, 'manifest.txt'), manifestText);
      console.log('Wrote manifest text');

      // Generate XML metadata file required by PMC
      const xml = pmcXmlFromManifest(manifest);
      console.log('Generated XML metadata');
      await fs.writeFile(path.join(tmpFolder, 'bulk_meta.xml'), xml);
      console.log('Wrote bulk_meta.xml');

      /**
       * ARCHIVE CREATION
       *
       * Package all files into a compressed tar.gz archive for upload
       */
      const tarFileName = `${id}.tar.gz`;
      const tarFilePath = path.join(tmpFolder, tarFileName);
      console.log('Creating tar file:', tarFilePath);

      try {
        await createTar({ gzip: true, file: tarFilePath, cwd: tmpFolder }, [
          'manifest.txt',
          'bulk_meta.xml',
          ...manifest.files.map(({ filename }) => filename),
        ]);
        console.log('Created tar file successfully');
      } catch (e) {
        console.error('Error creating tar.gz file', e);
        throw new Error('Error creating tar.gz file');
      }

      /**
       * SFTP UPLOAD
       *
       * Upload the completed archive to the PMC SFTP server
       * with automatic directory creation based on current date
       */
      const client = new Client();
      console.log('Connecting to SFTP server');

      await client.connect({
        host: process.env.FTP_HOST,
        port: parseInt(process.env.FTP_PORT ?? '22'),
        username: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
      });
      console.log('Connected to SFTP server');

      // Create date-based directory structure (e.g., upload/2024-01-15/)
      const targetDir = `upload/${hyphenatedFromDate(new Date())}`;
      console.log('Checking if target directory exists:', targetDir);

      const dirExists = await client.exists(targetDir);
      if (!dirExists) {
        console.log('Creating target directory:', targetDir);
        await client.mkdir(targetDir);
        console.log('Created target directory successfully');
      } else {
        console.log('Target directory already exists');
      }

      // Upload the archive
      await client.put(tarFilePath, `${targetDir}/${tarFileName}`);
      console.log('Uploaded tar file successfully');

      // Clean up SFTP connection
      await client.end();
      console.log('Disconnected from SFTP server');

      // Clean up temporary files
      removeFolder(tmpFolder);
      console.log('Removed temporary folder');

      return res.sendStatus(201);
    } catch (err: any) {
      console.error('Error processing deposit:', err);
      // Ensure cleanup even on error
      removeFolder(tmpFolder);
      return respondUnableToProcess(res, id);
    }
  });

  return app;
}
