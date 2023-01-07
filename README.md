<p align="center"><h1 align="center">
  NPM Security Fetcher (WIP)
</h1>

<p align="center">
  a Node.js CLI created to simplify the analysis of npm registry packages.
</p>

<p align="center">
    <a href="https://github.com/NodeSecure/npm-security-fetcher">
      <img src="https://img.shields.io/github/package-json/v/NodeSecure/npm-security-fetcher?style=flat-square" alt="npm version">
    </a>
    <a href="https://github.com/NodeSecure/npm-security-fetcher">
      <img src="https://img.shields.io/github/license/NodeSecure/npm-security-fetcher?style=flat-square" alt="license">
    </a>
    <a href="https://api.securityscorecards.dev/projects/github.com/NodeSecure/npm-security-fetcher">
      <img src="https://api.securityscorecards.dev/projects/github.com/NodeSecure/npm-security-fetcher/badge" alt="ossf scorecard">
    </a>
</p>

## About

I personally created this project to analyze npm packages by various criteria (popularity etc). Most researchers re-create the same codes over and over again and I thought it might be nice to have a CLI and various methods to simplify our lives.

## Features

- Pull packages from the npm registry by divers criteria.
- Offers you various methods to read and extract information from the npm tarball.
- Functionalities can be extended

## Requirements
- [Node.js](https://nodejs.org/en/) v16 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i npm-security-fetcher -g
```

or

```bash
$ git clone https://github.com/fraxken/npm-security-fetcher.git
$ cd npm-security-fetcher
$ npm ci
$ npm link
```

Then the **nsf** binary will be available in your terminal.

```bash
$ nsf --help
```

## Usage example

The first step is to create a javascript file with three methods:
- init (run before fetching and extracting packages from the npm registry).
- run (called for each downloaded npm packages).
- close (run at the end when there is no more packages to fetch).

This script must use the latest Node.js ESM (it also support top-level-await).

```js
import path from "path";

export async function init() {
    const baseDir = path.join(process.cwd(), "results");

    return { baseDir }; // <-- init and return context object!
}

export async function close(ctx) {
    console.log("close triggered");
}

export async function run(ctx, { name, location, root }) {
    console.log(ctx.baseDir);
    console.log(`handle package name: ${name}, location: ${location}`);
}
```

> There is no restriction on the nature of the context.

After editing your file you can run your script as follows
```bash
$ nsf npm myfile.js
```

The root folder **"example"** contains real world examples that are used (for js-x-ray etc).


## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/NodeSecure/npm-security-fetcher/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/NodeSecure/npm-security-fetcher/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/NodeSecure/npm-security-fetcher/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/NodeSecure/npm-security-fetcher/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Rossb0b"><img src="https://avatars.githubusercontent.com/u/39910164?v=4?s=100" width="100px;" alt="Nicolas Hallaert"/><br /><sub><b>Nicolas Hallaert</b></sub></a><br /><a href="https://github.com/NodeSecure/npm-security-fetcher/commits?author=Rossb0b" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/BlandineRdl"><img src="https://avatars.githubusercontent.com/u/18490995?v=4?s=100" width="100px;" alt="WildCöde"/><br /><sub><b>WildCöde</b></sub></a><br /><a href="https://github.com/NodeSecure/npm-security-fetcher/commits?author=BlandineRdl" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
