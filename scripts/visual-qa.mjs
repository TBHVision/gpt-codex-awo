import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const baseUrl = process.env.AWO_QA_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = path.join(process.cwd(), ".qa", "awo-44");
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
].filter(Boolean);

const routes = [
  "/",
  "/shop",
  "/shop/birthday-light",
  "/cart",
  "/checkout",
  "/reveal",
  "/people",
  "/reminders",
  "/studio",
  "/account",
  "/artists",
  "/admin/build",
  "/admin/ops",
];

const viewports = [
  { height: 900, name: "desktop", width: 1440 },
  { height: 844, mobile: true, name: "mobile", width: 390 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  throw new Error("Chrome was not found. Set CHROME_PATH to run visual QA.");
}

async function waitForEndpoint(port) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        return await response.json();
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

function safeName(route) {
  if (route === "/") {
    return "home";
  }

  return route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-$/g, "");
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

async function inspectRoute(client, route, viewport) {
  const url = new URL(route, baseUrl).toString();
  const load = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await load;
  await sleep(350);

  const result = await evaluate(
    client,
    `(() => {
      const overflow = [];
      const viewportWidth = document.documentElement.clientWidth;
      for (const element of document.querySelectorAll('body *')) {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (rect.right > viewportWidth + 2 || rect.left < -2 || element.scrollWidth > element.clientWidth + 2) {
          const text = (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 90);
          overflow.push({
            tag: element.tagName.toLowerCase(),
            className: String(element.className || '').slice(0, 120),
            text,
            rect: {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            },
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth
          });
        }
      }
      return {
        title: document.title,
        url: location.href,
        viewportWidth,
        bodyWidth: document.body.scrollWidth,
        docWidth: document.documentElement.scrollWidth,
        overflow: overflow.slice(0, 8)
      };
    })()`,
  );

  const screenshot = await client.send("Page.captureScreenshot", {
    captureBeyondViewport: false,
    format: "png",
  });
  const screenshotPath = path.join(outputDir, `${viewport.name}-${safeName(route)}.png`);
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

  const interactions = [];

  if (viewport.mobile && route === "/shop") {
    const menuResult = await evaluate(
      client,
      `(async () => {
        const button = Array.from(document.querySelectorAll('button')).find((item) =>
          item.textContent?.includes('Sections')
        );
        if (!button) {
          return { ok: false, reason: 'Sections button not found' };
        }
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const text = document.body.innerText;
        const normalized = text.toLowerCase();
        return {
          ok: normalized.includes('artists') && normalized.includes('reveal') && normalized.includes('reminders'),
          text: text.slice(0, 400)
        };
      })()`,
    );
    const menuScreenshot = await client.send("Page.captureScreenshot", {
      captureBeyondViewport: false,
      format: "png",
    });
    const menuScreenshotPath = path.join(outputDir, `${viewport.name}-${safeName(route)}-menu.png`);
    await writeFile(menuScreenshotPath, Buffer.from(menuScreenshot.data, "base64"));
    interactions.push({
      name: "mobile menu opens",
      screenshot: menuScreenshotPath,
      ...menuResult,
    });
  }

  return { interactions, route, screenshot: screenshotPath, viewport: viewport.name, ...result };
}

async function main() {
  const chrome = await findChrome();
  const userDataDir = await mkdtemp(path.join(tmpdir(), "awo-visual-qa-"));
  const port = 9229;
  const chromeProcess = spawn(chrome, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ]);

  chromeProcess.stderr.on("data", () => {});
  chromeProcess.stdout.on("data", () => {});

  const results = [];

  try {
    await mkdir(outputDir, { recursive: true });
    await waitForEndpoint(port);

    for (const viewport of viewports) {
      const tab = await createTab(port);
      const client = createCdpClient(tab.webSocketDebuggerUrl);
      await client.send("Page.enable");
      await client.send("Runtime.enable");
      await client.send("Network.enable");
      await client.send("Emulation.setDeviceMetricsOverride", {
        deviceScaleFactor: viewport.mobile ? 2 : 1,
        height: viewport.height,
        mobile: Boolean(viewport.mobile),
        width: viewport.width,
      });
      await client.send("Network.setCookie", {
        name: "awo_admin_session",
        url: baseUrl,
        value: process.env.AWO_ADMIN_SESSION_TOKEN ?? "test",
      });

      for (const route of routes) {
        results.push(await inspectRoute(client, route, viewport));
      }

      await client.close();
    }
  } finally {
    chromeProcess.kill();
    await sleep(500);
    await rmWithRetry(userDataDir);
  }

  const failures = results.filter(
    (result) =>
      result.overflow.length > 0 ||
      result.docWidth > result.viewportWidth + 2 ||
      result.interactions.some((interaction) => !interaction.ok),
  );
  const reportPath = path.join(outputDir, "report.json");
  await writeFile(reportPath, JSON.stringify({ baseUrl, failures, results }, null, 2));

  console.log(`Visual QA report: ${reportPath}`);
  for (const result of results) {
    console.log(
      `${failures.includes(result) ? "FAIL" : "PASS"} ${result.viewport} ${result.route} -> ${result.url}`,
    );
  }

  if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
