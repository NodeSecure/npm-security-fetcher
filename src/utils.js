// Require Node.js Dependencies
import os from "os";
import { extname, join, relative } from "path";
import { spawnSync } from "child_process";
import { stat, opendir, rmdir } from "fs/promises";

// Require Third-party Dependencies
import pacote from "pacote";

// SYMBOLS
const SYM_FILE = Symbol("symTypeFile");
const SYM_DIR = Symbol("symTypeDir");

// CONSTANTS
const kNpmToken = typeof process.env.NPM_TOKEN === "string" ? { token: process.env.NPM_TOKEN } : {};
const kExcludeDirectory = new Set(["node_modules", ".vscode", ".git"]);
const kDefaultNPMRegistryAddr = "https://registry.npmjs.org/";

// VARS
let localNPMRegistry = null;

export async function* getFilesRecursive(dir) {
    const dirents = await opendir(dir);

    for await (const dirent of dirents) {
        if (kExcludeDirectory.has(dirent.name)) {
            continue;
        }

        if (dirent.isFile()) {
            yield [SYM_FILE, join(dir, dirent.name)];
        }
        else if (dirent.isDirectory()) {
            const fullPath = join(dir, dirent.name);
            yield [SYM_DIR, fullPath];
            yield* getFilesRecursive(fullPath);
        }
    }
}

export async function getTarballComposition(tarballDir) {
    const ext = new Set();
    const files = [];
    const dirs = [];
    let { size } = await stat(tarballDir);

    for await (const [kind, file] of getFilesRecursive(tarballDir)) {
        switch (kind) {
            case SYM_FILE:
                ext.add(extname(file));
                files.push(file);
                break;
            case SYM_DIR:
                dirs.push(file);
                break;
        }
    }

    try {
        const sizeAll = await Promise.all([
            ...files.map((file) => stat(file)),
            ...dirs.map((file) => stat(file))
        ]);
        size += sizeAll.reduce((prev, curr) => prev + curr.size, 0);
    }
    catch (err) {
        // ignore
    }

    return { ext, size, files };
}

export function getRegistryURL(force = false) {
    if (localNPMRegistry !== null && !force) {
        return localNPMRegistry;
    }

    try {
        const stdout = spawnSync(
            `npm${process.platform === "win32" ? ".cmd" : ""}`, ["config", "get", "registry"]).stdout.toString();
        localNPMRegistry = stdout.trim() === "" ? kDefaultNPMRegistryAddr : stdout.trim();

        return localNPMRegistry;
    }
    catch (error) {
        return kDefaultNPMRegistryAddr;
    }
}

export async function fetchPackage(packageExpr, dest) {
    await rmdir(dest, { recursive: true });
    await pacote.extract(packageExpr, dest, {
        ...kNpmToken,
        registry: getRegistryURL(),
        cache: `${os.homedir()}/.npm`
    });
    await new Promise((resolve) => setImmediate(resolve));
}

export const constants = Object.freeze({
    FILE: SYM_FILE,
    DIRECTORY: SYM_DIR
});
