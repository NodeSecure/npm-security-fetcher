#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { styleText } from "node:util";

// Import Third-party Dependencies
import sade from "sade";

// Import Internal Dependencies
import * as commands from "./commands/index.js";

const prog = sade("npm-security-fetcher").version("2.0.0");
const location = styleText("yellow", process.cwd());
console.log(
  styleText(
    "gray",
    `\n > executing npm-security-fetch at: ${location}\n`
  )
);

prog
  .command("npm <file>")
  .describe("Run NPM Security fetched with a given javascript file!")
  .option("-l, --limit", "limit of packages to fetch!", 500)
  .option("-m, --max", "maximum concurrent download", 5)
  .action(commands.npm);

prog.parse(process.argv);
