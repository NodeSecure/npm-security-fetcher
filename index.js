// Require Node.js Dependencies
import os from "os";
import fs from "fs/promises";
import path from "path";
import { on, EventEmitter } from "events";

// Require Third-party Dependencies
import NPMRegistry from "@slimio/npm-registry";
import { klona } from "klona/json";
import is from "@slimio/is";
import Locker from "@slimio/lock";
import isMinified from "is-minified-code";
import JSXRay from "js-x-ray";

// Require Internal Dependencies
import * as utils from "./src/utils.js";

// CONSTANTS
const kRegSearchLimit = 10;
const kDefaultCriteria = { popularity: 1 };
const kDefaultLimit = 500;
const kDefaultFetcher = (raw) => `${raw.package.name}@${raw.package.version}`;
const kMaximumConcurrentDownload = 10;

// VARS
const npmReg = new NPMRegistry(utils.getRegistryURL());
// (typeof process.env.NPM_TOKEN === "string" && npmReg.login(process.env.NPM_TOKEN));

export async function* SearchPackages(options = {}) {
    const limit = Number(options.limit) || kDefaultLimit;
    const delay = Number(options.delay) || 0;
    const dataFetcher = is.func(options.dataFetcher) ? options.dataFetcher : kDefaultFetcher;
    const criteria = is.plainObject(options.criteria) ? klona(options.criteria) : kDefaultCriteria;
    let from = 0;

    while (true) {
        const searchOptions = Object.assign(criteria, { text: "boost-exact:true", size: kRegSearchLimit, from });
        const { objects } = await npmReg.search(searchOptions);
        yield* objects.map(dataFetcher);

        from += kRegSearchLimit;
        if (from >= limit) {
            break;
        }

        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

export async function DownloadFromSource(source, ee, lock, tmpLocation) {
    try {
        for await (const packageExpr of source) {
            const free = await lock.acquireOne();

            setImmediate(() => {
                const tmpPathLocation = path.join(tmpLocation, packageExpr);
                utils.fetchPackage(packageExpr, tmpPathLocation)
                    .then(() => {
                        ee.emit("row", { done: false, value: { name: packageExpr, location: tmpPathLocation, root: tmpLocation } });
                        free();
                    })
                    .catch(console.error);
            });
        }
        ee.emit("row", { done: true });
    }
    catch (error) {
        ee.emit("row", { done: true, error });
    }
}

export async function* DownloadRegistryPackage(source, options = {}) {
    const maxConcurrent = Number(options.maxConcurrent) || kMaximumConcurrentDownload;
    const lock = new Locker({ maxConcurrent });
    const ee = new EventEmitter();

    // Create temporary directory
    const tmpLocation = await fs.mkdtemp(path.join(os.tmpdir(), "/"));
    setImmediate(() => DownloadFromSource(source, ee, lock, tmpLocation));

    try {
        for await (const [data] of on(ee, "row")) {
            const { done, error = null, value = null } = data;
            if (done) {
                if (error !== null) {
                    throw error;
                }
                break;
            }
            else if (value !== null) {
                yield value;
            }
        }
    }
    finally {
        await fs.rmdir(tmpLocation, { recursive: true });
    }
}

export async function AnalyseJavaScriptFile(fileLocation) {
    const str = await fs.readFile(fileLocation, "utf-8");
    const isMin = path.basename(fileLocation).includes(".min") || isMinified(str);

    return JSXRay.runASTAnalysis(str, { isMinified: isMin });
}

export const Utils = {
    getTarballComposition: utils.getTarballComposition,
    getFilesRecursive: utils.getFilesRecursive
}
