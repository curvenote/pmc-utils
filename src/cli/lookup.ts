import { Command } from 'commander';
import type { ISession } from 'myst-cli-utils';
import { clirun, getSession } from 'myst-cli-utils';
import { lookupMetadata } from '../web/lookup.js';

export async function lookupArticle(session: ISession, doi: string) {
  session.log.info(`Retrieving metadata for ${doi}`);
  const result = await lookupMetadata(doi, { fetch, log: session.log });
  session.log.info('Got a result:', JSON.stringify(result, null, 2));
}

function makeLookupCLI(program: Command) {
  const command = new Command('lookup')
    .description('Lookup metadata from Crossref using a DOI')
    .argument('<doi>', 'A DOI to lookup')
    .action(clirun(lookupArticle, { program, getSession }));
  return command;
}

export function addLookupCLI(program: Command) {
  program.addCommand(makeLookupCLI(program));
}
