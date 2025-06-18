// Import Node.js Dependencies
import fs from "node:fs/promises";
import path from "node:path";

// Import Third-party Dependencies
import { tarball } from "@nodesecure/scanner";

// Import Internal Dependencies
import type { RunOptions } from "../index.js";

type Context = {
  outdir: string;
  count: number;
};

export async function init(): Promise<Context> {
  const outdir = path.join(process.cwd(), "nsf-results");
  await fs.mkdir(outdir, { recursive: true });

  return { outdir, count: 0 };
}

export async function close() {
  console.log("close triggered");
}

export async function run(
  ctx: Context,
  options: RunOptions
) {
  const { name, location } = options;

  try {
    console.log(`handle package name: ${name}, count: ${ctx.count++}`);
    const result = await tarball.scanPackage(location, name);

    const fileName = path.join(ctx.outdir, name.replace(/\//g, "__")) + ".json";
    await fs.writeFile(
      fileName,
      JSON.stringify(result, null, 2)
    );
  }
  finally {
    await fs.rmdir(location, { recursive: true });
  }
}
