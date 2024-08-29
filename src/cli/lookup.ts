import { Command } from 'commander';
import type { ISession } from 'myst-cli-utils';
import { clirun, getSession } from 'myst-cli-utils';
import { lookupMetadata } from '../web/lookup.js';
import { crossrefToMinimalPMCDeposit } from '../web/convert.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function lookupArticle(
  session: ISession,
  doi: string,
  opts: { output?: string; full?: boolean },
) {
  session.log.info(`Retrieving metadata for ${doi}`);
  const metadata = await lookupMetadata(doi, { fetch, log: session.log });
  const deposit = crossrefToMinimalPMCDeposit(metadata, {
    agency: 'hhmi',
    grant: { funder: 'hhmi' },
    systemEmail: 'workspace.pmc@hhmi.org',
    user: { firstName: 'John', lastName: 'Doe', email: 'jdoe@hhmi.org' },
  });

  const folder = `deposit-${doi.replace('/', '_')}`;
  const depositPath = opts.output ? path.join(opts.output, folder) : folder;
  await fs.mkdir(depositPath, { recursive: true });
  await fs.writeFile(path.join(depositPath, 'meta.json'), JSON.stringify(deposit, null, 2));
}

function makeLookupCLI(program: Command) {
  const command = new Command('lookup')
    .description('Lookup metadata from Crossref using a DOI')
    .argument('<doi>', 'A DOI to lookup')
    .option('-o, --output <folder>', 'specify an output location')
    .option('--full', 'put as much metadata as possible in the deposit')
    .action(clirun(lookupArticle, { program, getSession }));
  return command;
}

export function addLookupCLI(program: Command) {
  program.addCommand(makeLookupCLI(program));
}
