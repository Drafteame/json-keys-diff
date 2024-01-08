#!/usr/bin/env node

import { Command } from "commander";
import compareFiles from "../src/commands/compareFiles.js";
import compareFolder from "../src/commands/compareFolder.js";

const program = new Command();

compareFiles(program);
compareFolder(program);

program.parse(process.argv);
