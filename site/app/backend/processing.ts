import path from 'node:path';
import fs from 'node:fs/promises';
import { AAMDepositManifest } from '@curvenote/pmc-client';

export async function startPMCSubmission(manifest: AAMDepositManifest) {
  const jobId = '1234';

  // in reality this is creating a job for tracking and launching
  // a long running process to deposit the files
  const location = `../deposits/job/${jobId}`;
  const filename = path.join(location, 'manifest.json');
  await fs.mkdir(location, { recursive: true });
  await fs.writeFile(filename, JSON.stringify(manifest, null, 2));

  return jobId;
}
