// Node.js
import fs from "node:fs/promises";
import path from "node:path";

// Third-party
import filenamify from "filenamify";

// Internal
import { analyzeJavaScriptFile, Utils } from "../index";

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

type RunOptions = {
  name: string;
  location: string;
  root: string;
};

export async function run(ctx: Ctx, { name, location, root }: RunOptions) {
  try {
    console.log(`handle package name: ${name}, count: ${count++}`);
    const { files } = await Utils.getTarballComposition(location);
    const jsFiles = files.filter((name) =>
      kJavaScriptExtensions.has(path.extname(name))
    );
    const toWait = [];

    for (const file of jsFiles) {
      const cleanName = filenamify(
        path.relative(root, file).slice(name.length),
        { replacement: kDefaultReplacement }
      );
      toWait.push(runASTAnalysis(ctx, cleanName, file, name));
    }

    const results = (await Promise.allSettled(toWait))
      .filter(({ status }) => status === "fulfilled")
      .map((p) => (p as PromiseFulfilledResult<unknown>).value);

    const content = JSON.stringify(
      Object.assign({}, ...results),
      null,
      kJSONSpace
    );

    const fileName =
      path.join(ctx.analysisDir, name.replace(/\//g, "__")) + ".json";
    await fs.writeFile(fileName, content);
  } finally {
    await fs.rmdir(location, { recursive: true });
  }
}

async function dumpParsingError(
  ctx: Ctx,
  error: { code: string; message: string; stack: string } | string,
  cleanName: string,
  pkgName: string
) {
  try {
    const dumpStr = JSON.stringify(
      {
        pkgName,
        code: typeof error === "string" ? null : error.code || null,
        message: typeof error === "string" ? error : error.message || "",
        stack:
          typeof error === "string"
            ? ""
            : error.stack
            ? error.stack.split("\n")
            : "",
      },
      null,
      kJSONSpace
    );

    await fs.writeFile(path.join(ctx.errorDir, `${cleanName}.json`), dumpStr);
  } catch {
    // ignore
  }
}

type Ctx = { analysisDir: string; errorDir: string };

async function runASTAnalysis(
  ctx: Ctx,
  cleanName: string,
  location: string,
  pkgName: string
) {
  try {
    const ASTAnalysis = await analyzeJavaScriptFile(location);
    //@ts-ignore
    const deps = [...ASTAnalysis.dependencies];
    const warnings = ASTAnalysis.warnings;

    return { [cleanName]: { warnings, deps } };
  } catch (error: any) {
    if (error.name === "SyntaxError") {
      return {};
    }
    await dumpParsingError(ctx, error, cleanName, pkgName);

    return {};
  }
}
