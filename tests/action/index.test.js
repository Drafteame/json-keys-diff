import sinon from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
import fs from "fs";

import Action from "./../../src/action/index.js";

const expect = chai.expect;

chai.use(sinonChai);

describe("Action core functions", () => {
  let sandbox;
  let fsStub;
  let isDirectoryStub;
  let testOptions;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    let lstatResp = { isDirectory: () => false };
    isDirectoryStub = sandbox.stub(lstatResp, "isDirectory");

    fsStub = {
      existsSync: sandbox.stub(fs, "existsSync"),
      lstatSync: sandbox.stub(fs, "lstatSync").returns(lstatResp),
      readdirSync: sandbox.stub(fs, "readdirSync"),
      readFileSync: sandbox.stub(fs, "readFileSync"),
      statSync: sandbox.stub(fs, "statSync"),
    };

    testOptions = {
      files: [],
      searchPath: "",
      searchPattern: "\\.json$",
      ignoreFile: ".json-diff-ignore.json",
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("Should fail if explicit files are empty and search path is empty", () => {
    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal("Search path can't be empty.");
      return;
    }

    expect.fail("Expected exception");
  });

  it("Should fail if explicit files are lest than 2", () => {
    testOptions.files = ["some/path/to/file.json"];

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.returns(true);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal(
        "You need at least 2 files to be compared.",
      );
      return;
    }

    expect.fail("Expected exception");
  });

  it("Should fail different files of explicit files are less than 2", () => {
    testOptions.files = ["ome/path/to/file.json", "ome/path/to/file.json"];

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);

    fsStub.statSync
      .withArgs("ome/path/to/file.json")
      .returns({ ino: "file", dev: "file-dev" });

    fsStub.existsSync.returns(true);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal(
        "You need at least 2 files to be compared.",
      );
      return;
    }

    expect.fail("Expected exception");
  });

  it("Should fail if explicit file not exists", () => {
    testOptions.files = ["some/path/to/file1.json", "some/path/to/file2.json"];

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);

    fsStub.existsSync.withArgs("some/path/to/file1.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file1.json")
      .returns({ ino: "file1", dev: "file1-dev" });

    fsStub.existsSync.withArgs("some/path/to/file2.json").returns(false);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal("File some/path/to/file2.json not found.");
      return;
    }

    expect.fail("Expected exception");
  });

  it("Should create instance if explicit files are valid", () => {
    testOptions.files = ["some/path/to/file1.json", "some/path/to/file2.json"];

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);

    fsStub.existsSync.withArgs("some/path/to/file1.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file1.json")
      .returns({ ino: "file1", dev: "file1-dev" });

    fsStub.existsSync.withArgs("some/path/to/file2.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file2.json")
      .returns({ ino: "file2", dev: "file2-dev" });

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contains("some/path/to/file1.json");
      expect(action.getFileList()).to.contains("some/path/to/file2.json");
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should fail if search path not exists", () => {
    testOptions.searchPath = `some/search/folder`;

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(false);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal(
        `Invalid path '${testOptions.searchPath}', path should exists and be a directory.`,
      );
      return;
    }

    expect.fail(`Expected exception`);
  });

  it("Should fail if search path is not a directory", () => {
    testOptions.searchPath = `some/search/folder`;

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(false);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal(
        `Invalid path '${testOptions.searchPath}', path should exists and be a directory.`,
      );
      return;
    }

    expect.fail(`Expected exception`);
  });

  it("Should fail if files filtered in search path are less than 2", () => {
    testOptions.searchPath = `some/search/folder`;

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(true);

    fsStub.readdirSync.returns([
      { name: "file1.json", isDirectory: () => false },
      { name: "file2.ejson", isDirectory: () => false },
      { name: "folder", isDirectory: () => true },
      { name: "file3.txt", isDirectory: () => false },
    ]);

    try {
      new Action(testOptions);
    } catch (e) {
      expect(e.message).to.be.equal(
        `You need at least 2 files to be compared.`,
      );
      return;
    }

    expect.fail(`Expected exception`);
  });

  it("Should obtain a custom list from custom pattern", () => {
    testOptions.searchPath = `some/search/folder`;
    testOptions.searchPattern = "json$";

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(true);

    fsStub.readdirSync.returns([
      { name: "file1.json", isDirectory: () => false },
      { name: "file2.ejson", isDirectory: () => false },
      { name: "folder", isDirectory: () => true },
      { name: "file3.txt", isDirectory: () => false },
    ]);

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contain(
        `${testOptions.searchPath}/file1.json`,
      );
      expect(action.getFileList()).to.contain(
        `${testOptions.searchPath}/file2.ejson`,
      );
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should obtain normalized file list from not normalized search path", () => {
    testOptions.searchPath = `some/search/folder/`;
    testOptions.searchPattern = "json$";

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(true);

    fsStub.readdirSync.returns([
      { name: "file1.json", isDirectory: () => false },
      { name: "file2.ejson", isDirectory: () => false },
      { name: "folder", isDirectory: () => true },
      { name: "file3.txt", isDirectory: () => false },
    ]);

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contain(
        `${testOptions.searchPath}file1.json`,
      );
      expect(action.getFileList()).to.contain(
        `${testOptions.searchPath}file2.ejson`,
      );
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should return differences of each file", () => {
    testOptions.searchPath = `some/search/folder/`;
    testOptions.searchPattern = "json$";

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(true);

    fsStub.readdirSync.returns([
      { name: "file1.json", isDirectory: () => false },
      { name: "file2.ejson", isDirectory: () => false },
      { name: "folder", isDirectory: () => true },
      { name: "file3.txt", isDirectory: () => false },
    ]);

    let readOpts = { encoding: "utf-8" };

    fsStub.readFileSync
      .withArgs(`${testOptions.searchPath}file1.json`, readOpts)
      .returns(
        JSON.stringify({
          common: 1,
          missing1: "some",
        }),
      );

    fsStub.readFileSync
      .withArgs(`${testOptions.searchPath}file2.ejson`, readOpts)
      .returns(
        JSON.stringify({
          common: 1,
          missing2: "some",
        }),
      );

    const expected = {
      "some/search/folder/file1.json": ["missing2"],
      "some/search/folder/file2.ejson": ["missing1"],
    };

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contain(`some/search/folder/file1.json`);
      expect(action.getFileList()).to.contain(`some/search/folder/file2.ejson`);

      const missing = action.run();

      expect(JSON.stringify(missing)).to.be.equal(JSON.stringify(expected));
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should not return differences if not exists", () => {
    testOptions.searchPath = `some/search/folder/`;
    testOptions.searchPattern = "json$";

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(true);

    fsStub.readdirSync.returns([
      { name: "file1.json", isDirectory: () => false },
      { name: "file2.ejson", isDirectory: () => false },
      { name: "folder", isDirectory: () => true },
      { name: "file3.txt", isDirectory: () => false },
    ]);

    let readOpts = { encoding: "utf-8" };

    fsStub.readFileSync
      .withArgs("some/search/folder/file1.json", readOpts)
      .returns(
        JSON.stringify({
          common: 1,
          missing1: "some",
          missing2: "some",
        }),
      );

    fsStub.readFileSync
      .withArgs("some/search/folder/file2.ejson", readOpts)
      .returns(
        JSON.stringify({
          common: 1,
          missing1: "some",
          missing2: "some",
        }),
      );

    const expected = {};

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contain(`some/search/folder/file1.json`);
      expect(action.getFileList()).to.contain(`some/search/folder/file2.ejson`);

      const missing = action.run();

      expect(JSON.stringify(missing)).to.be.equal(JSON.stringify(expected));
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should return differences just for some files if exists", () => {
    testOptions.searchPath = `some/search/folder/`;
    testOptions.searchPattern = "json$";

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(false);
    fsStub.existsSync.withArgs(testOptions.searchPath).returns(true);
    isDirectoryStub.returns(true);

    fsStub.readdirSync.returns([
      { name: "file1.json", isDirectory: () => false },
      { name: "file2.ejson", isDirectory: () => false },
      { name: "folder", isDirectory: () => true },
      { name: "file3.txt", isDirectory: () => false },
    ]);

    let readOpts = { encoding: "utf-8" };

    fsStub.readFileSync
      .withArgs("some/search/folder/file1.json", readOpts)
      .returns(
        JSON.stringify({
          common: 1,
          missing1: "some",
        }),
      );

    fsStub.readFileSync
      .withArgs("some/search/folder/file2.ejson", readOpts)
      .returns(
        JSON.stringify({
          common: 1,
          missing1: "some",
          missing2: "some",
        }),
      );

    const expected = {
      "some/search/folder/file1.json": ["missing2"],
    };

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contain(`some/search/folder/file1.json`);
      expect(action.getFileList()).to.contain(`some/search/folder/file2.ejson`);

      const missing = action.run();

      expect(JSON.stringify(missing)).to.be.equal(JSON.stringify(expected));
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should load default ignore configuration", () => {
    testOptions.files = ["some/path/to/file1.json", "some/path/to/file2.json"];
    delete testOptions.ignoreFile;

    let ignoreConfig = [
      {
        pattern: "file1\\.json",
        ignoreKeys: ["key1", "key2"],
      },
      {
        pattern: "file2\\.json",
        ignoreKeys: ["key11", "key22"],
      },
    ];

    fsStub.existsSync.withArgs(".json-diff-ignore.json").returns(true);

    fsStub.readFileSync
      .withArgs(".json-diff-ignore.json", {
        encoding: "utf-8",
      })
      .returns(JSON.stringify(ignoreConfig));

    fsStub.existsSync.withArgs("some/path/to/file1.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file1.json")
      .returns({ ino: "file1", dev: "file1-dev" });

    fsStub.existsSync.withArgs("some/path/to/file2.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file2.json")
      .returns({ ino: "file2", dev: "file2-dev" });

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contains("some/path/to/file1.json");
      expect(action.getFileList()).to.contains("some/path/to/file2.json");

      expect(JSON.stringify(action.getIgnoreRules())).to.be.equal(
        JSON.stringify(ignoreConfig),
      );
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should load custom path for ignore file", () => {
    testOptions.files = ["some/path/to/file1.json", "some/path/to/file2.json"];
    testOptions.ignoreFile = `path/to/.json-diff-ignore.json`;

    let ignoreConfig = [
      {
        pattern: "file1\\.json",
        ignoreKeys: ["key1", "key2"],
      },
      {
        pattern: "file2\\.json",
        ignoreKeys: ["key11", "key22"],
      },
    ];

    fsStub.existsSync.withArgs(testOptions.ignoreFile).returns(true);

    fsStub.readFileSync
      .withArgs(testOptions.ignoreFile, {
        encoding: "utf-8",
      })
      .returns(JSON.stringify(ignoreConfig));

    fsStub.existsSync.withArgs("some/path/to/file1.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file1.json")
      .returns({ ino: "file1", dev: "file1-dev" });

    fsStub.existsSync.withArgs("some/path/to/file2.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file2.json")
      .returns({ ino: "file2", dev: "file2-dev" });

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contains("some/path/to/file1.json");
      expect(action.getFileList()).to.contains("some/path/to/file2.json");

      expect(JSON.stringify(action.getIgnoreRules())).to.be.equal(
        JSON.stringify(ignoreConfig),
      );
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });

  it("Should ignore keys if found on ignore configuration", () => {
    testOptions.files = ["some/path/to/file1.json", "some/path/to/file2.json"];
    testOptions.ignoreFile = `path/to/.json-diff-ignore.json`;

    let ignoreConfig = [
      {
        pattern: "file1\\.json",
        ignoreKeys: ["key1"],
      },
      {
        pattern: "file2\\.json",
        ignoreKeys: ["key2"],
      },
    ];

    fsStub.existsSync.withArgs(testOptions.ignoreFile).returns(true);

    fsStub.readFileSync
      .withArgs(testOptions.ignoreFile, {
        encoding: "utf-8",
      })
      .returns(JSON.stringify(ignoreConfig));

    fsStub.existsSync.withArgs("some/path/to/file1.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file1.json")
      .returns({ ino: "file1", dev: "file1-dev" });

    fsStub.existsSync.withArgs("some/path/to/file2.json").returns(true);
    fsStub.statSync
      .withArgs("some/path/to/file2.json")
      .returns({ ino: "file2", dev: "file2-dev" });

    let readOpts = { encoding: "utf-8" };

    fsStub.readFileSync.withArgs("some/path/to/file1.json", readOpts).returns(
      JSON.stringify({
        common: 1,
        missing1: "some",
        missing2: "some",
        key2: "asd",
      }),
    );

    fsStub.readFileSync.withArgs("some/path/to/file2.json", readOpts).returns(
      JSON.stringify({
        common: 1,
        missing1: "some",
        missing2: "some",
        key1: "asd",
      }),
    );

    try {
      const action = new Action(testOptions);

      expect(action.getFileList()).to.contains("some/path/to/file1.json");
      expect(action.getFileList()).to.contains("some/path/to/file2.json");

      expect(JSON.stringify(action.getIgnoreRules())).to.be.equal(
        JSON.stringify(ignoreConfig),
      );

      const missing = action.run();

      expect(JSON.stringify(missing)).to.be.equal(JSON.stringify({}));
    } catch (e) {
      expect.fail(`Error: ${e.message}`);
    }
  });
});
