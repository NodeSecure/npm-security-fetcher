
// Node.js
import fs from "fs/promises";
import path from "path";

// Third-party
import filenamify from "filenamify";

// Internal
import { AnalyseJavaScriptFile, Utils } from "../index.js";

// CONSTANTS
const kJavaScriptExtensions = new Set([".js", ".mjs", ".cjs"]);
const kJSONSpace = 2;
const kDefaultReplacement = "#";

let count = 0;

export async function init() {
    const baseDir = path.join(process.cwd(), "results");

    const analysisDir = path.join(baseDir, "packages");
    const errorDir = path.join(baseDir, "parsing-errors");
    await fs.mkdir(errorDir, { recursive: true });

    return { analysisDir, errorDir };
}

export async function close() {
    console.log("close triggered");
}

export async function run(ctx, { name, location, root }) {
    try {
        const packageAnalysisDir = path.join(ctx.analysisDir, name);
        await fs.mkdir(packageAnalysisDir, { recursive: true });
        console.log(`handle package name: ${name}, count: ${count++}`);

        const { files } = await Utils.getTarballComposition(location);
        const jsFiles = files.filter((name) => kJavaScriptExtensions.has(path.extname(name)));
        const toWait = [];

        for (const file of jsFiles) {
            const cleanName = filenamify(path.relative(root, file).slice(name.length), { replacement: kDefaultReplacement });
            toWait.push(runASTAnalysis(ctx, cleanName, packageAnalysisDir, file));
        }

        await Promise.allSettled(toWait);
    }
    finally {
        await fs.rmdir(location, { recursive: true });
    }
}

async function dumpParsingError(ctx, error, cleanName) {
    const dumpStr = JSON.stringify({
        code: error.code || null,
        message: typeof error === "string" ? error : error.message || "",
        stack: error.stack ? error.stack.split("\n") : ""
    }, null, kJSONSpace);

    await fs.writeFile(path.join(ctx.errorDir, `${cleanName}.json`), dumpStr);
}

// eslint-disable-next-line max-params
async function runASTAnalysis(ctx, cleanName, baseNameDir, location) {
    try {
        const ASTAnalysis = await AnalyseJavaScriptFile(location);
        const filePath = path.join(baseNameDir, `${cleanName}.json`);

        await fs.writeFile(filePath, JSON.stringify(ASTAnalysis, null, kJSONSpace));
    }
    catch (error) {
        if (error.name === "SyntaxError") {
            return;
        }
        await dumpParsingError(ctx, error, cleanName);
    }
}
