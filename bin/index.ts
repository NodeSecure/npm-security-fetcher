#!/usr/bin/env node

import "make-promises-safe";
import dotenv from "dotenv";
dotenv.config();

// Import Third-party Dependencies
import * as colors from "kleur/colors";
import sade from "sade";

// Import Internal Dependencies
import * as commands from "./commands/index";

const prog = sade("npm-security-fetcher").version("1.0.0");
console.log(
  colors.gray(
    `\n > executing npm-security-fetch at: ${colors.yellow(process.cwd())}\n`
  )
);

prog
  .command("npm <file>")
  .describe("Run NPM Security fetched with a given javascript file!")
  .option("-l, --limit", "limit of packages to fetch!", 500)
  .option("-m, --max", "maximum concurrent download", 5)
  .action(commands.npm);

prog.parse(process.argv);
