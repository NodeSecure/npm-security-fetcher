// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import timers from "node:timers/promises";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Import Third-party Dependencies
import { Mutex } from "@openally/mutex";

// Import Internal Dependencies
import {
  searchPackagesByCriteria,
  downloadPackageOnRegistry
} from "../../index.js";

export async function npm(
  file: string,
  cmdOptions: { limit: string; max: string }
) {
  const { limit, max } = cmdOptions;

  const filePath = pathToFileURL(path.join(process.cwd(), file));
  const { init, run, close } = await import(
    URL.prototype.toString.call(filePath)
  );

  // Create temporary location for extracting tarballs
  const tempLocation = await fs.mkdtemp(path.join(os.tmpdir(), "/"));

  const searchOptions = { limit };
  const downloadOptions = { maxConcurrent: Number(max), tempLocation };

  const ctx = await init();
  const concurrencyLimiter = new Mutex({ concurrency: 20 });

  try {
    const searchIterator = searchPackagesByCriteria(searchOptions);

    for await (const data of downloadPackageOnRegistry(
      searchIterator,
      downloadOptions
    )) {
      const free = await concurrencyLimiter.acquire();

      run(ctx, data)
        .catch(console.error)
        .finally(free);
    }

    while (true) {
      if (concurrencyLimiter.running === 0) {
        break;
      }
      await timers.setTimeout(100);
    }
  }
  finally {
    await close(ctx);

    await fs.rm(tempLocation, { force: true, recursive: true });
  }
}
