import { access } from "node:fs/promises";
import path from "node:path";

const retiredMirrorPaths = ["apps/web/src", "apps/web/public", "apps/web/package.json"];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const lingeringPaths = [];

  for (const retiredPath of retiredMirrorPaths) {
    const fullPath = path.join(process.cwd(), retiredPath);
    if (await exists(fullPath)) {
      lingeringPaths.push(retiredPath);
    }
  }

  if (lingeringPaths.length > 0) {
    throw new Error(
      `Retired mirrored app paths still exist: ${lingeringPaths.join(", ")}`,
    );
  }

  console.log("PASS single root Next.js app; apps/web mirror is retired");
}

main().catch((error) => {
  console.error(`FAIL single-root app check\n${error.message}`);
  process.exitCode = 1;
});
