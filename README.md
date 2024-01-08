# json-keys-diff

This is a simple commandline tool to check if exists differences between the keys of 2 or more json files, check what
keys are missing and report by each file what should be the differences.

## Installation

```bash
npm i --global json-keys-diff
```

## Usage

### Compare specific files

```bash
# Compare 2 or more specific files
jkdiff files ../some/path/dev.json ../some/path/prod.json 

# Result
#
# Differences found on the next files:
# ../some/path/prod.json 
# - timestamp
```

### Compare all matching files inside a specific path

```bash
# Compare all files that its name match with the regexp pattern provided
jkdiff folder ../some/path -p "\\.json$"  

# Result
#
# Differences found on the next files:
# ../some/path/prod.json 
# - timestamp
```

### Using ignore rules

You can configure ignore rules to omit specific missing keys if the file that is being evaluated match with the regexp
defined on the ignore file:

**Ignore file**

```json
[
  {
    "pattern": "file-*\\.json",
    "ignoreKeys": ["key1", "key2"]
  },
  {
    "pattern": "file2-*\\.json",
    "ignoreKeys": ["key11", "key22"]
  },
  {
    "pattern": "some/path",
    "ignoreKeys": ["key11", "key22"]
  }
]
```

**Command to use ignore file**

```bash
# Using folder diff
jkdiff folder -i ignore-file.json ../some/path -p "\\.json$" 

# Using files diff
jkdiff files -i ignore-file.json file1.json file2.json
```

If the option `-i` or `--ignore-file` is not pass to the command, it will search for a default ignore file called
`.json-diff-ignore.json` on the execution path.
