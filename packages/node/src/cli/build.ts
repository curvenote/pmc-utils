import { Command } from 'commander';
import type { ISession } from 'myst-cli-utils';
import { clirun, getSession } from 'myst-cli-utils';
import fs from 'node:fs/promises';
import { buildDeposit } from '../buildDeposit.js';

async function buildDepositCLI(
  session: ISession,
  manifestPath: string,
  opts: { output?: string; keepFiles?: boolean },
) {
  // check manifestPath exists and load the manifest
  try {
    await fs.stat(manifestPath);
  } catch (e) {
    session.log.error(`Manifest not found at ${manifestPath}`);
    session.log.debug(e);
    process.exit(1);
  }

  let maybeManifest = {};
  try {
    maybeManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  } catch (e: any) {
    session.log.error(`Failed to parse manifest at ${manifestPath}: ${e.message}`);
    session.log.debug(e);
    process.exit(1);
  }

  return buildDeposit(maybeManifest, {
    fetch,
    log: session.log,
    ...opts,
  });
}

function makeBuildDepositCLI(program: Command) {
  const command = new Command('build-deposit')
    .description('Build a deposit for PMC')
    .argument('<manifestPath>', 'Path to the (JSON) manifest file')
    .option('-o, --output <folder>', 'specify an output location')
    .option('-k, --keep-files', 'keep the files in the output location')
    .action(clirun(buildDepositCLI, { program, getSession }));
  return command;
}

export async function addBuildDepositsCLI(program: Command) {
  program.addCommand(makeBuildDepositCLI(program));
}
