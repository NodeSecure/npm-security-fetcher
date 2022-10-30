// Import Node.js Dependencies
import os from "node:os";
import timers from "node:timers/promises";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import pacote from "pacote";
import { getLocalRegistryURL } from "@nodesecure/npm-registry-sdk";

// CONSTANTS
const kNpmToken =
  typeof process.env.NPM_TOKEN === "string"
    ? { token: process.env.NPM_TOKEN }
    : {};

export async function fetchPackage(
  packageExpr: string,
  dest: string
): Promise<void> {
  await fs.rm(dest, { recursive: true, force: true });

  await pacote.extract(packageExpr, dest, {
    ...kNpmToken,
    registry: getLocalRegistryURL(),
    cache: `${os.homedir()}/.npm`
  });
  await timers.setImmediate();
}
