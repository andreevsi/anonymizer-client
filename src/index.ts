#!/usr/bin/env node

import dotenv from 'dotenv';
import { Cli } from './cli/cli';

dotenv.config();

async function main() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cli = new Cli();
}

main();
