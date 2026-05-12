import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const baseUrl = process.env.AWO_QA_BASE_URL ?? "http://127.0.0.1:3000";
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
].filter(Boolean);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(filePath) {
  try {
    const { stat } = await import("node:fs/promises");
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    if (candidate && (await fileExists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Chrome was not found. Set CHROME_PATH to run demo journey QA.");
}

async function rmWithRetry(target) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(target, { force: true, recursive: true });
      return;
    } catch (error) {
      if (error?.code !== "EBUSY" && error?.code !== "EPERM") {
        throw error;
      }
      await sleep(250);
    }
  }
}

async function waitForEndpoint(port) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }

  throw new Error("Timed out waiting for Chrome debugging endpoint.");
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { reject, resolve } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result ?? {});
      }
      return;
    }

    if (message.method && listeners.has(message.method)) {
      for (const listener of listeners.get(message.method)) {
        listener(message.params ?? {});
      }
    }
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    async close() {
      socket.close();
    },
    async send(method, params = {}) {
      await ready;
      id += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { reject, resolve });
      });
    },
    waitFor(method, timeoutMs = 15000) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs);
        const listener = (params) => {
          clearTimeout(timeout);
          listeners.set(
            method,
            (listeners.get(method) ?? []).filter((item) => item !== listener),
          );
          resolve(params);
        };
        listeners.set(method, [...(listeners.get(method) ?? []), listener]);
      });
    },
  };
}

async function createTab(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(`Unable to create Chrome tab: ${response.status}`);
  }

  return response.json();
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  }

  return result.result?.value;
}

async function waitForJourneyState(client) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const state = await evaluate(
      client,
      `(() => ({
        url: location.href,
        bodyText: document.body.innerText,
        recipient: document.querySelector('input[placeholder="Demo Recipient"]')?.value ?? '',
        occasion: document.querySelector('input[placeholder="Birthday"]')?.value ?? '',
        message: document.querySelector('textarea')?.value ?? '',
      }))()`,
    );

    const bodyText = state.bodyText ?? "";
    if (
      state.url.includes("/checkout?demo=1") &&
      bodyText.includes("Guided demo mode loaded Wildflower Notes") &&
      bodyText.includes("Wildflower Notes") &&
      bodyText.includes("$5.50") &&
      state.recipient === "Demo Recipient" &&
      state.occasion === "Birthday" &&
      state.message.includes("I picked this card because it felt calm")
    ) {
      return state;
    }

    await sleep(100);
  }

  throw new Error("Guided demo checkout state did not load correctly.");
}

async function main() {
  const chrome = await findChrome();
  const userDataDir = await mkdtemp(path.join(tmpdir(), "awo-demo-journey-"));
  const port = 9230;
  const chromeProcess = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "about:blank",
  ]);

  chromeProcess.stderr.on("data", () => {});
  chromeProcess.stdout.on("data", () => {});

  let client = null;

  try {
    await waitForEndpoint(port);
    const tab = await createTab(port);
    client = createCdpClient(tab.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    const load = client.waitFor("Page.loadEventFired");
    await client.send("Page.navigate", { url: new URL("/demo", baseUrl).toString() });
    await load;
    await sleep(250);

    const clickResult = await evaluate(
      client,
      `(async () => {
        const button = Array.from(document.querySelectorAll('button')).find((item) =>
          item.textContent?.includes('Start Guided Checkout')
        );
        if (!button) return { ok: false, reason: 'Start Guided Checkout button not found' };
        button.click();
        return { ok: true };
      })()`,
    );

    if (!clickResult.ok) {
      throw new Error(clickResult.reason ?? "Unable to start guided checkout.");
    }

    const state = await waitForJourneyState(client);
    console.log(`PASS /demo guided checkout -> ${state.url}`);
  } finally {
    if (client) {
      await client.close();
    }
    chromeProcess.kill();
    await sleep(500);
    await rmWithRetry(userDataDir);
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
