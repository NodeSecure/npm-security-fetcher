// Import Node.js Dependencies
import os from "node:os";
import timers from "node:timers/promises";
import fs from "node:fs/promises";
import path from "node:path";

// Import Third-party Dependencies
import pacote from "pacote";
import { getLocalRegistryURL } from "@nodesecure/npm-registry-sdk";
import { walk } from "@nodesecure/fs-walk";

// CONSTANTS
const kNpmToken =
  typeof process.env.NPM_TOKEN === "string"
    ? { token: process.env.NPM_TOKEN }
    : {};

export async function getTarballComposition(tarballDir: string) {
  const ext = new Set();
  const files = [];
  const dirs = [];
  let { size } = await fs.stat(tarballDir);

  for await (const [dirent, file] of walk(tarballDir)) {
    if (dirent.isFile()) {
      ext.add(path.extname(file));
      files.push(file);
    } else if (dirent.isDirectory()) {
      dirs.push(file);
    }
  }

  try {
    const sizeAll = await Promise.all([
      ...files.map((file) => fs.stat(file)),
      ...dirs.map((file) => fs.stat(file)),
    ]);
    size += sizeAll.reduce((prev, curr) => prev + curr.size, 0);
  } catch (err) {
    // ignore
  }

  return { ext, size, files };
}

export async function fetchPackage(packageExpr: string, dest: string) {
  await fs.rm(dest, { recursive: true, force: true });

  await pacote.extract(packageExpr, dest, {
    ...kNpmToken,
    registry: getLocalRegistryURL(),
    cache: `${os.homedir()}/.npm`,
  });
  await timers.setImmediate();
}
