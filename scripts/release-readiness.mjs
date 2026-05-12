import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const outputDir = path.join(process.cwd(), ".qa", "release-readiness");
const latestReportPath = path.join(outputDir, "latest.json");
const port = Number(process.env.AWO_RELEASE_PORT || 3100);
const baseUrl = `http://127.0.0.1:${port}`;

const report = {
  baseUrl,
  finishedAt: null,
  generatedAt: new Date().toISOString(),
  status: "running",
  steps: [],
};

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

function spawnNpm(args, options = {}) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", npmCommand, ...args], {
      ...options,
      shell: false,
    });
  }

  return spawn(npmCommand, args, {
    ...options,
    shell: false,
  });
}

async function writeReport() {
  await mkdir(outputDir, { recursive: true });
  const payload = JSON.stringify(report, null, 2);
  await writeFile(latestReportPath, `${payload}\n`);
  await writeFile(
    path.join(outputDir, `${report.generatedAt.replace(/[:.]/g, "-")}.json`),
    `${payload}\n`,
  );
}

function runCommand(name, args, options = {}) {
  return new Promise((resolve) => {
    const started = nowMs();
    const child = spawnNpm(args, {
      cwd: process.cwd(),
      env: { ...process.env, ...options.env },
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on("close", (code) => {
      resolve({
        command: `${npmCommand} ${args.join(" ")}`,
        durationMs: nowMs() - started,
        name,
        outputTail: output.slice(-4000),
        status: code === 0 ? "passed" : "failed",
      });
    });
  });
}

function startServer() {
  const child = spawnNpm(
    ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      detached: process.platform !== "win32",
      env: process.env,
    },
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk.toString()));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk.toString()));

  return child;
}

function stopServer(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      return;
    } catch {
      // Fall back to the direct child kill below.
    }
  }

  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, "SIGTERM");
      return;
    } catch {
      // Fall back to killing the direct child below.
    }
  }

  child.kill();
}

async function waitForServer() {
  const started = nowMs();

  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/shop`);
      if (response.ok) {
        return {
          command: `next start health check ${baseUrl}/shop`,
          durationMs: nowMs() - started,
          name: "server",
          status: "passed",
        };
      }
    } catch {
      // Keep waiting until the production server accepts requests.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return {
    command: `next start health check ${baseUrl}/shop`,
    durationMs: nowMs() - started,
    name: "server",
    outputTail: "Timed out waiting for local production server.",
    status: "failed",
  };
}

async function record(stepPromise) {
  const step = await stepPromise;
  report.steps.push(step);
  await writeReport();

  if (step.status !== "passed") {
    throw new Error(`${step.name} failed`);
  }
}

async function main() {
  let serverProcess = null;

  try {
    await writeReport();
    await record(runCommand("lint", ["run", "lint"]));
    await record(runCommand("mirror", ["run", "test:mirror"]));
    await record(runCommand("build", ["run", "build"]));

    serverProcess = startServer();
    await record(waitForServer());
    await record(
      runCommand("smoke", ["run", "test:smoke"], {
        env: { SMOKE_BASE_URL: baseUrl },
      }),
    );
    await record(
      runCommand("demo", ["run", "test:demo"], {
        env: { AWO_QA_BASE_URL: baseUrl },
      }),
    );
    await record(
      runCommand("visual", ["run", "test:visual"], {
        env: { AWO_QA_BASE_URL: baseUrl },
      }),
    );

    report.status = "passed";
  } catch (error) {
    report.status = "failed";
    report.error =
      error instanceof Error ? error.message : "Release readiness failed.";
    process.exitCode = 1;
  } finally {
    stopServer(serverProcess);

    report.finishedAt = new Date().toISOString();
    await writeReport();
    console.log(`Release readiness report: ${latestReportPath}`);
  }
}

main();
