/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { exec } from 'node:child_process';
import { AAMDepositManifest } from 'pmc-utils';
import MiniSearch from 'minisearch';

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

    return { ok: true, stdout, xml };
  } catch (error) {
    return { ok: false, error };
  }
}

type NIHJournalEntry = {
  ISSNPrint: string;
  ISSNOnline: string;
  JrId: number;
  JournalTitle: string;
  MedAbbr: string;
  IsoAbbr: string;
  NlmId: string;
};

type NIHJournalLookupResult = NIHJournalEntry & { score: number; id: number };

export async function nihFuzzyJournalLookup(search: string) {
  console.log('Searching for:', search);
  try {
    const data = await fs.readFile(
      path.join(path.resolve(__dirname, '../../..'), 'data', 'journals.json'),
      'utf-8',
    );

    const journals = JSON.parse(data).map((journal: any, id: number) => ({ id, ...journal }));

    const miniSearch = new MiniSearch({
      fields: ['JournalTitle', 'NlmId', 'MedAbbr'], // fields to index for full-text search
      storeFields: ['name', 'description'], // fields to return with search results
    });

    miniSearch.addAll(journals);
    const results = miniSearch.search(search);

    const records: NIHJournalLookupResult[] = results
      .map((result: any) => ({
        ...journals.find((journal: any) => journal.id === result.id),
        score: result.score,
      }))
      .slice(0, 20);

    console.log('Results:', records.length, JSON.stringify(records, null, 2));
    return { journals: records, perPage: 20, total: results.length };
  } catch (error) {
    console.error('Error reading journals file', error);
    return { journals: [], perPage: 0, total: 0 };
  }
}
