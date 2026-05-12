import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const mirrors = [
  {
    left: "src",
    right: "apps/web/src",
  },
  {
    left: "public",
    right: "apps/web/public",
  },
];

async function listFiles(root) {
  const files = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(path.relative(root, fullPath).replaceAll("\\", "/"));
      }
    }
  }

  await walk(root);
  return files.sort();
}

async function fileHash(filePath) {
  const content = await readFile(filePath);
  const isBinary = content.includes(0);
  const comparableContent = isBinary
    ? content
    : Buffer.from(content.toString("utf8").replace(/\r\n/g, "\n"), "utf8");

  return createHash("sha256").update(comparableContent).digest("hex");
}

async function checkMirror({ left, right }) {
  const leftRoot = path.join(process.cwd(), left);
  const rightRoot = path.join(process.cwd(), right);
  const leftFiles = await listFiles(leftRoot);
  const rightFiles = await listFiles(rightRoot);
  const allFiles = new Set([...leftFiles, ...rightFiles]);
  const failures = [];

  for (const relativePath of [...allFiles].sort()) {
    if (!leftFiles.includes(relativePath)) {
      failures.push(`${left} missing ${relativePath}`);
      continue;
    }

    if (!rightFiles.includes(relativePath)) {
      failures.push(`${right} missing ${relativePath}`);
      continue;
    }

    const leftHash = await fileHash(path.join(leftRoot, relativePath));
    const rightHash = await fileHash(path.join(rightRoot, relativePath));
    if (leftHash !== rightHash) {
      failures.push(`${relativePath} differs between ${left} and ${right}`);
    }
  }

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }

  console.log(`PASS ${left} mirrors ${right} (${leftFiles.length} files)`);
}

async function main() {
  for (const mirror of mirrors) {
    await checkMirror(mirror);
  }
}

main().catch((error) => {
  console.error(`FAIL mirror check\n${error.message}`);
  process.exitCode = 1;
});
