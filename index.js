"use strict";

// Require Node.js Dependencies
const os = require("os");
const fs = require("fs").promises;
const path = require("path");
const { on, EventEmitter } = require("events");

// Require Third-party Dependencies
const NPMRegistry = require("@slimio/npm-registry");
const { klona } = require("klona");
const is = require("@slimio/is");
const Locker = require("@slimio/lock");
const isMinified = require("is-minified-code");
const { runASTAnalysis } = require("js-x-ray");

// Require Internal Dependencies
const utils = require("./src/utils");

// CONSTANTS
const kRegSearchLimit = 10;
const kDefaultCriteria = { popularity: 1 };
const kDefaultLimit = 500;
const kDefaultFetcher = (raw) => `${raw.package.name}@${raw.package.version}`;
const kMaximumConcurrentDownload = 10;

// VARS
const npmReg = new NPMRegistry(utils.getRegistryURL());
// (typeof process.env.NPM_TOKEN === "string" && npmReg.login(process.env.NPM_TOKEN));

async function* SearchPackages(options = {}) {
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

async function DownloadFromSource(source, ee, lock, tmpLocation) {
    try {
        for await (const packageExpr of source) {
            const free = await lock.acquireOne();

            setImmediate(() => {
                const tmpPathLocation = path.join(tmpLocation, packageExpr);
                utils.fetchPackage(packageExpr, tmpPathLocation)
                .then(() => {
                        ee.emit("row", { done: false, value: { name: packageExpr, location: tmpPathLocation } });
                        free();
                    })
                    .catch(console.error);
            });
        }
        ee.emit("row", { done: true })
    }
    catch(error) {
        ee.emit("row", { done: true, error });
    }
}

async function* DownloadRegistryPackage(source, options = {}) {
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

async function AnalyseJavaScriptFile(fileLocation) {
    const str = await fs.readFile(fileLocation, "utf-8");
    const isMin = path.basename(fileLocation).includes(".min") || isMinified(str);

    return runASTAnalysis(str, { isMinified: isMin });
}

module.exports = {
    SearchPackages,
    DownloadRegistryPackage,
    AnalyseJavaScriptFile,
    Utils: {
        getTarballComposition: utils.getTarballComposition,
        getFilesRecursive: utils.getFilesRecursive
    }
};
