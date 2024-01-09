#!/usr/bin/env node

import { Command } from "commander";
import { VERSION } from "../src/version.js";
import compareFiles from "../src/commands/compareFiles.js";
import compareFolder from "../src/commands/compareFolder.js";

const program = new Command();

compareFiles(program);
compareFolder(program);

program
  .command("version")
  .description("Print current program version")
  .action(() => console.log(`jkdiff version v${VERSION}`));

program.parse(process.argv);
