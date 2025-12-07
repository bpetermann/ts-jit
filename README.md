# ts-jit

A **TypeScript reimplementation** of Git internals, inspired by the book [_Building Git_](https://shop.jcoglan.com/building-git/).  
This project re-creates the core parts of Git as a learning exercise and reference implementation.


## 🚀 Overview

This repository is a work-in-progress TypeScript version of the concepts from **Building Git**.

Current implemented commands:

| Command | Description |
|----------|--------------|
| `jit init` | Initializes a new `.git` directory with `objects`, `refs`, and `HEAD`. |
| `jit add <path>` | Adds files to the index, generating blob objects under `.git/objects`. |
| `jit commit` | Writes the current index as a tree and creates a new commit object. |


## 🧠 How it works

- Object database compatible with real Git (`.git/objects/...`)
- Index file written in real Git format (`DIRC`), readable by `git ls-files`
- SHA-1 based content-addressed storage
- TypeScript modules organized similar to the Ruby version in *Building Git*

You can verify your generated data using regular `git` commands, e.g.:

```bash
git ls-files
git ls-files --stage
git cat-file -p <sha>
```

## ⚙️ Installation & Usage

Before running `jit`, you’ll need to make it available locally or globally.

### Option 1: Local install (recommended)
Install the CLI into your project:

```bash
npm i <path-to-ts-jit>
```

```bash
npx jit init
npx jit add hello.txt
```

### Option 2: Global link (for development)
From the root of this repository:

```bash
npm link
```
Now you can use `jit` anywhere:

```bash
jit init
jit add hello.txt
jit commit
```

### Option 3: Run directly via Node

If you prefer not to install or link:

```bash
node path/to/ts-jit/app/index.js init
```

> **Note**: The shorthand command jit <command> only works if the package is linked globally (via npm link) or installed locally and run with npx.


## 🧪 Example

```bash
mkdir foo
cd foo

# create a sample file
echo "hello world" > hello.txt

# initialize jit
jit init

# add and commit
jit add hello.txt
echo "initial commit" | jit commit

# inspect with git
git ls-files
git cat-file -p HEAD

```

## 🧪 Tests

The following command executes all Vitest test suites

```js
npm run test
```

## 🧭 Status

| Component               | Status | Notes                                                 |
| ----------------------- | ------ | ------------------------------------------------------|
| `init`                  | ✅      | Creates .git directory                               |
| `add`                   | ✅      | Index + blob writing works and passes Git validation |

## 📚 References

- Building Git by [James Coglan](https://shop.jcoglan.com/building-git/)
- Git source code and documentation

## 🔖 Bookmark
➜ Page: 128
