import { Command } from "commander";
import exec from "./exec.js";

/**
 * Execute Json diff keys comparison to the files that match the search pattern inside the search path
 *
 * @param {Command} program Instance of commander package
 */
export default function compareFolder(program) {
  program
    .command("folder <searchPath>")
    .description(
      "execute json keys diff on the files of a given search path that matches with the search pattern",
    )
    .option(
      "-p,--search-pattern <string>",
      "regular expression to match file names",
      "\\.json$",
    )
    .option(
      "-i,--ignore-file <string>",
      "Path to the ignore file rules",
      ".json-diff-ignore.json",
    )
    .action((searchPath, options) => {
      try {
        process.exit(
          exec({
            searchPath: searchPath,
            searchPattern: options.searchPattern,
            ignoreFile: options.ignoreFile,
          }),
        );
      } catch (e) {
        console.log(e.message);
        process.exit(1);
      }
    });
}
