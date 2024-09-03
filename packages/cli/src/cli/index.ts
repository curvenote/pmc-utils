#!/usr/bin/env node
import { Command } from 'commander';
import version from '../version.js';
import { addLookupCLI } from './lookup.js';

const program = new Command();

addLookupCLI(program);

program.version(`v${version}`, '-v, --version', 'Print the current version of pmc-utils');
program.option('-d, --debug', 'Log out any errors to the console.');
program.parse(process.argv);
