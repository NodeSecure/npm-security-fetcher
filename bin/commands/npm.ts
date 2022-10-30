// Import Node.js Dependencies
import path from "node:path";
import { pathToFileURL } from "node:url";

// Import Third-party Dependencies
import Locker from "@slimio/lock";

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

  const searchOptions = { limit };
  const downloadOptions = { maxConcurrent: max };

  const ctx = await init();
  const topLock = new Locker({ maxConcurrent: 20 });

  try {
    const searchIterator = searchPackagesByCriteria(searchOptions);

    for await (const data of downloadPackageOnRegistry(
      searchIterator,
      downloadOptions
    )) {
      const free = await topLock.acquireOne();

      run(ctx, data).catch(console.error).finally(free);
    }
  }
  finally {
    await close(ctx);

    while (true) {
      if (topLock.running === 0) {
        break;
      }
    }
  }
}
