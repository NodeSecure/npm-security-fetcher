# npm-security-fetcher
Fetch packages from npm for Security purposes

## Requirements
- [Node.js](https://nodejs.org/en/) v12 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i npm-security-fetcher -g
```

Then create your javascript file:
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

And then run your script:
```bash
$ nsf npm myfile.js
```

Real example in the root directory `example`.
