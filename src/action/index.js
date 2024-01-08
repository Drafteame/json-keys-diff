import fs from "fs";
import path from "path";

import isEmpty from "../utils/isEmpty.js";

import {
  EmptySearchPath,
  InvalidSearchPath,
  NotEnoughFiles,
  NotFoundPath,
} from "./errors.js";

const defaultRegExp = "\\.json$";

const defaultOptions = {
  files: [],
  searchPath: "",
  searchPattern: defaultRegExp,
  ignoreFile: ".json-diff-ignore.json",
};

export default class Action {
  /**
   * List of file paths to be compared
   * @type {Array<string>}
   */
  #files;

  /**
   * Path to a folder that should be inspected to find files to be compared.
   * @type {string}
   */
  #searchPath;

  /**
   * Regular expression to filter files found on search path.
   * @type {string}
   */
  #searchPattern;

  /**
   * Map with rules to ignore specified keys on specific files that match one or more patterns
   * @type {Array<Object>}
   */
  #ignoreRules;

  /**
   * Object with the loaded ignore keys by file
   * @type {Object}
   */
  #ignoreKeysByFile;

  constructor(options) {
    const opts = { ...defaultOptions, ...options };

    this.#files = opts.files;
    this.#searchPath = opts.searchPath;

    this.#searchPattern = opts.searchPattern;

    this.#ignoreRules = this.#getIgnoreRules(opts.ignoreFile);
    this.#ignoreKeysByFile = {};

    this.#files = this.#validateInputs();
  }

  /**
   * Return the computed list of files to be compared.
   *
   * @returns {Array<string>}
   */
  getFileList() {
    return this.#files;
  }

  /**
   * Return the loaded ignore rules.
   *
   * @returns {Array<Object>}
   */
  getIgnoreRules() {
    return this.#ignoreRules;
  }

  /**
   * Execute comparison of file keys and return the found differences.
   *
   * @returns {Object}
   */
  run() {
    const contents = this.#readFilesContent();
    return this.#compareContents(contents);
  }

  /**
   * Receive and Object with the keys of each file and compare against each other to found what keys are missing
   * on each file.
   *
   * @param {Object} contents Object that each property is a file and the content is an array of its keys
   *
   * @returns {Object} Each property is a file with differences and its content is an array of string keys
   */
  #compareContents(contents) {
    const missingKeys = {};

    const keys = Object.keys(contents);

    keys.forEach((file1) => {
      let missing = [];

      keys.forEach((file2) => {
        if (file1 === file2) {
          return;
        }

        const keysFile1 = contents[file1];
        const keysFile2 = contents[file2];

        keysFile2
          .filter((key) => {
            if (this.#keyShouldBeIgnored(file1, key)) {
              return false;
            }

            const notInKeys1 = !keysFile1.includes(key);
            const notInMissing = !missing.includes(key);

            return notInKeys1 && notInMissing;
          })
          .forEach((key) => {
            missing.push(key);
          });
      });

      if (missing.length > 0) {
        missingKeys[file1] = missing;
      }
    });

    return missingKeys;
  }

  /**
   * Read the content of each file of the filtered list and obtain its keys to be compared against each other.
   *
   * @returns {Object} each property is an array of strings
   */
  #readFilesContent() {
    const contents = {};

    this.#files.forEach((file) => {
      const content = fs.readFileSync(file, { encoding: "utf-8" });
      contents[file] = Object.keys(JSON.parse(content));
    });

    return contents;
  }

  /**
   * Validate action inputs and return a list of the files that should be compared based on the configurations.
   *
   * @returns {Array<string>}
   */
  #validateInputs() {
    if (isEmpty(this.#files)) {
      return this.#validateSearchPath();
    }

    this.#validateFiles();

    return this.#files;
  }

  /**
   * Validate and split list of specific files, to check if there are at least 2 files and if ech path exists
   *
   * @throws {NotEnoughFiles} If there are less than 2 files
   * @throws {NotFoundPath} If specified file path not exists.
   *
   * @return {Array<string>}
   */
  #validateFiles() {
    let filesSet = {};

    this.#files.forEach((file) => {
      if (!fs.existsSync(file)) {
        throw new NotFoundPath(`File ${file} not found.`);
      }

      let fileStats = fs.statSync(file);

      if (!this.#isDuplicated(filesSet, fileStats)) {
        filesSet[file] = fileStats;
      }
    });

    this.#files = Object.keys(filesSet);

    if (this.#files.length < 2) {
      throw new NotEnoughFiles("You need at least 2 files to be compared.");
    }
  }

  #isDuplicated(filesSet, currentFileInfo) {
    let files = Object.keys(filesSet);

    let duplicated = false;

    files.every((file) => {
      let info = filesSet[file];
      duplicated =
        info.ino === currentFileInfo.ino && info.dev === currentFileInfo.dev;

      return !duplicated;
    });

    return duplicated;
  }

  /**
   * Validate search configuration and return a list of files that should be compared.
   *
   * @throws {EmptySearchPath} Search path configuration is empty.
   * @throws {InvalidSearchPath} Search path not exists or is not a directory.
   *
   * @returns {Array<string>}
   */
  #validateSearchPath() {
    if (isEmpty(this.#searchPath)) {
      throw new EmptySearchPath("Search path can't be empty.");
    }

    if (
      !fs.existsSync(this.#searchPath) ||
      !fs.lstatSync(this.#searchPath).isDirectory()
    ) {
      throw new InvalidSearchPath(
        `Invalid path '${this.#searchPath}', path should exists and be a directory.`,
      );
    }

    return this.#getFilesFromPath();
  }

  /**
   * Return a filtered list of files found on the search path that matches git the configured pattern.
   *
   * @throws {NotEnoughFiles} Filtered files are less than 2.
   *
   * @returns {Array<string>}
   */
  #getFilesFromPath() {
    const regexp = new RegExp(this.#searchPattern);

    let files = fs
      .readdirSync(this.#searchPath, { withFileTypes: true })
      .filter((file) => {
        if (file.isDirectory()) {
          return false;
        }

        return regexp.test(file.name);
      })
      .map((file) => `${this.#normalizePath(this.#searchPath)}/${file.name}`);

    if (files.length < 2) {
      throw new NotEnoughFiles("You need at least 2 files to be compared.");
    }

    return files;
  }

  /**
   * Normalize a given folder path to not end with a final separator.
   *
   * @param {string} input Denormalized folder path.
   *
   * @returns {string}
   */
  #normalizePath(input) {
    const normalizedPath = path.join(input);
    const lastSegment = path.basename(normalizedPath);
    return path.join(path.dirname(normalizedPath), lastSegment);
  }

  /**
   * Return ignore file configuration to apply on checks
   *
   * @param {string} ignoreFile Path to the specified ignore file
   *
   * @return {Array<Object>}
   */
  #getIgnoreRules(ignoreFile) {
    if (isEmpty(ignoreFile) || !fs.existsSync(ignoreFile)) {
      return [];
    }

    const content = fs.readFileSync(ignoreFile, { encoding: "utf-8" });

    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(
        `Error reading ignore file from '${ignoreFile}', no rules will be applied: ${e.message}`,
      );
    }
  }

  /**
   * Validate if a given key should be ignored or not by the given file.
   *
   * @param {string} file File that should ignore or not the given key if not present on it.
   * @param {string} key Key that should be ignored or not by the file.
   *
   * @returns {boolean}
   */
  #keyShouldBeIgnored(file, key) {
    if (file in this.#ignoreKeysByFile) {
      return this.#ignoreKeysByFile[file].includes(key);
    }

    let keysToIgnore = [];

    this.#ignoreRules.forEach((rule) => {
      const pattern = rule.pattern || null;
      const keys = rule.ignoreKeys || [];

      if (isEmpty(pattern) || keys.length === 0) {
        return;
      }

      const regexp = new RegExp(pattern);

      if (regexp.test(file)) {
        keys.forEach((item) => {
          keysToIgnore.push(item);
        });
      }
    });

    this.#ignoreKeysByFile[file] = keysToIgnore;

    return keysToIgnore.includes(key);
  }
}
