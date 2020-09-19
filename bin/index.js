#!/usr/bin/env node

import "make-promises-safe";
import dotenv from "dotenv";
dotenv.config();

// Require Node.js Dependencies
import path from "path";
import { pathToFileURL } from "url";

// Require Third-party Dependencies
import * as colors from "kleur/colors";
import sade from "sade";
import Locker from "@slimio/lock";

// Require Internal Dependencies
import { SearchPackages, DownloadRegistryPackage } from "../index.js";

const prog = sade("npm-security-fetcher").version("1.0.0");
console.log(colors.gray(`\n > executing npm-security-fetch at: ${colors.yellow(process.cwd())}\n`));

prog
    .command("npm <file>")
    .describe("Run NPM Security fetched with a given javascript file!")
    .action(npm);

prog.parse(process.argv);

async function npm(file)  {
    const filePath = pathToFileURL(path.join(process.cwd(), file));
    const { init, run, close } = await import(filePath);

    const ctx = await init();
    const topLock = new Locker({ maxConcurrent: 30 });

    try {
        for await (const data of DownloadRegistryPackage(SearchPackages())) {
            const free = await topLock.acquireOne();
            run(ctx, data).catch(console.error).finally(free);
        }
    }
    finally {
        await close(ctx);
        while(true) {
            if (topLock.running === 0) break;
        }
    }
}

