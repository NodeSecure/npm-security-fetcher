
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
    await fs.mkdir(analysisDir, { recursive: true });
    await fs.mkdir(errorDir, { recursive: true });

    return { analysisDir, errorDir };
}

export async function close() {
    console.log("close triggered");
}

export async function run(ctx, { name, location, root }) {
    try {
        console.log(`handle package name: ${name}, count: ${count++}`);
        const { files } = await Utils.getTarballComposition(location);
        const jsFiles = files.filter((name) => kJavaScriptExtensions.has(path.extname(name)));
        const toWait = [];

        for (const file of jsFiles) {
            const cleanName = filenamify(path.relative(root, file).slice(name.length), { replacement: kDefaultReplacement });
            toWait.push(runASTAnalysis(ctx, cleanName, file, name));
        }

        const results = (await Promise.allSettled(toWait))
            .filter(({ status }) => status === "fulfilled")
            .map(({ value }) => value);

        const content = JSON.stringify(Object.assign({}, ...results), null, kJSONSpace);

        const fileName = path.join(ctx.analysisDir, name.replace(/\//g, "__")) + ".json";
        await fs.writeFile(fileName, content);
    }
    finally {
        await fs.rmdir(location, { recursive: true });
    }
}

async function dumpParsingError(ctx, error, cleanName, pkgName) {
    try {
        const dumpStr = JSON.stringify({
            pkgName,
            code: error.code || null,
            message: typeof error === "string" ? error : error.message || "",
            stack: error.stack ? error.stack.split("\n") : ""
        }, null, kJSONSpace);

        await fs.writeFile(path.join(ctx.errorDir, `${cleanName}.json`), dumpStr);
    }
    catch {
        // ignore
    }
}

async function runASTAnalysis(ctx, cleanName, location, pkgName) {
    try {
        const ASTAnalysis = await AnalyseJavaScriptFile(location);
        const deps = [...ASTAnalysis.dependencies];
        const warnings = ASTAnalysis.warnings.map((warn) => {
            delete warn.location;

            return warn;
        });

        return { [cleanName]: { warnings, deps } };
    }
    catch (error) {
        if (error.name === "SyntaxError") {
            return {};
        }
        await dumpParsingError(ctx, error, cleanName, pkgName);

        return {};
    }
}
