import { Command } from "commander";
import exec from "./exec.js";

/**
 * Compare json keys of a list of files between each other
 *
 * @param {Command} program Instance of commander package
 */
export default function compareFiles(program) {
  program
    .command("files <fileList...>")
    .description("execute json keys diff on a list of specific files")
    .option(
      "-i,--ignore-file <string>",
      "Path to the ignore file rules",
      ".json-diff-ignore.json",
    )
    .action((files, options) => {
      try {
        process.exit(
          exec({
            files: files,
            ignoreFile: options.ignoreFile,
          }),
        );
      } catch (e) {
        console.log(e.message);
        process.exit(1);
      }
    });
}
