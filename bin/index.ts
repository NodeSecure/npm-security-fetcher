#!/usr/bin/env node

// Import Node.js Dependencies
import { loadEnvFile } from "node:process";
import { parseArgs, styleText } from "node:util";

try {
  loadEnvFile();
}
catch {
  // do nothing, we can continue without .env file
}

// Import Internal Dependencies
import * as commands from "./commands/index.js";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    limit: { type: "string", short: "l", default: "500" },
    max: { type: "string", short: "m", default: "5" }
  },
  allowPositionals: true
});

const [file] = positionals;
if (!file) {
  console.error("Usage: nsf <file> [--limit <n>] [--max <n>]");
  process.exit(1);
}

const location = styleText("yellow", process.cwd());
console.log(
  styleText(
    "gray",
    `\n > executing npm-security-fetch at: ${location}\n`
  )
);

await commands.npm(file, values);
