import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { exec } from 'node:child_process';
import { AAMDepositManifest } from '@curvenote/pmc-web';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createJobManifest(manifest: AAMDepositManifest) {
  const jobId = 'job-id-ABCD';

  // in reality this is creating a job for tracking and launching
  // a long running process to deposit the files
  const location = `../deposits/job/${jobId}`;
  const filename = path.join(location, 'manifest.json');
  await fs.mkdir(location, { recursive: true });
  await fs.writeFile(filename, JSON.stringify(manifest, null, 2));

  return { jobId, manifest };
}

export async function createDepositFile(jobId: string) {
  const command = `pmc build-deposit deposits/job/${jobId}/manifest.json -k`;
  const workingDirectory = path.resolve(__dirname, '../../..');

  try {
    const stdout = await new Promise((resolve, reject) =>
      exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          reject(`Error executing command: ${error.message}`);
          return;
        }

        if (stderr) {
          console.error(`Error output: ${stderr}`);
          reject(`Error output: ${stderr}`);
          return;
        }

        // Output the result of the command
        console.log(`Command output: ${stdout}`);
        resolve(stdout);
      }),
    );

    const xml = await fs.readFile(
      path.join(workingDirectory, 'deposits/pmc', 'task-1234', 'bulk_meta.xml'),
      'utf-8',
    );

    console.log(xml);

    return { ok: true, stdout, xml };
  } catch (error) {
    return { ok: false, error };
  }
}
