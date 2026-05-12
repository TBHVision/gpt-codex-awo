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
    on(method, listener) {
      listeners.set(method, [...(listeners.get(method) ?? []), listener]);
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

async function waitForRevealDemoState(client) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const state = await evaluate(
      client,
      `(() => ({
        url: location.href,
        bodyText: document.body.innerText,
        code: document.querySelector('input[placeholder="AWO-DEMO-001"]')?.value ?? '',
        pin: document.querySelector('input[placeholder="1234"]')?.value ?? '',
        unlockEnabled: !Array.from(document.querySelectorAll('button')).find((button) =>
          button.textContent?.includes('Unlock Playback')
        )?.disabled,
      }))()`,
    );

    const bodyText = state.bodyText ?? "";
    if (
      state.url.includes("/reveal?code=AWO-DEMO-001&demo=1") &&
      bodyText.includes("Reveal unlocked") &&
      bodyText.includes("Wildflower Notes") &&
      bodyText.includes("Demo-safe proof layer")
    ) {
      return state;
    }

    if (
      state.url.includes("/reveal?code=AWO-DEMO-001&demo=1") &&
      bodyText.includes("Demo reveal mode prefilled the code and PIN") &&
      state.code === "AWO-DEMO-001" &&
      state.pin === "1234" &&
      state.unlockEnabled
    ) {
      return state;
    }

    await sleep(100);
  }

  throw new Error("Guided demo reveal state did not load correctly.");
}

async function verifyRevealApi(client) {
  const result = await evaluate(
    client,
    `(async () => {
      const response = await fetch('/api/reveal/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cardCode: 'AWO-DEMO-001', pin: '1234' })
      });
      const payload = await response.json().catch(() => null);
      return {
        ok: response.ok && payload?.success === true,
        status: response.status,
        cardTitle: payload?.card_title ?? '',
        message: payload?.message ?? ''
      };
    })()`,
  );

  if (!result.ok || result.cardTitle !== "Wildflower Notes") {
    throw new Error(
      `Reveal verification API did not return the seeded proof payload. status=${result.status} card=${result.cardTitle} message=${result.message}`,
    );
  }

  console.log(`PASS /api/reveal/verify seeded demo credential -> ${new URL("/api/reveal/verify", baseUrl)}`);
}

async function unlockDemoReveal(client) {
  const requiredMarkers = [
    "Reveal unlocked",
    "Wildflower Notes",
    "Sender message",
    "Chain of custody",
    "Reveal record",
    "Evidence",
    "Demo-safe proof layer",
    "Operator proof links",
  ];
  let lastText = "";
  let missingMarkers = [];
  let lastButtonState = "";
  const diagnostics = [];
  client.on("Runtime.exceptionThrown", (params) => {
    diagnostics.push(params.exceptionDetails?.text ?? "Runtime exception");
  });
  client.on("Log.entryAdded", (params) => {
    if (params.entry?.level === "error") {
      diagnostics.push(params.entry.text);
    }
  });
  await client.send("Log.enable");

  lastText = await evaluate(client, "document.body.innerText");
  missingMarkers = requiredMarkers.filter((marker) =>
    !(lastText ?? "").toLowerCase().includes(marker.toLowerCase()),
  );
  if (missingMarkers.length === 0) {
    console.log(`PASS /reveal recipient playback unlock -> ${new URL("/reveal?code=AWO-DEMO-001&demo=1", baseUrl)}`);
    return;
  }

  const hydrationProbe = await evaluate(
    client,
    `(async () => {
      const showButton = Array.from(document.querySelectorAll('button')).find((item) =>
        item.textContent?.trim() === 'Show'
      );
      const pinInput = document.querySelector('input[placeholder="1234"]');
      if (!showButton || !pinInput) return { ok: false, reason: 'PIN visibility probe controls missing' };
      showButton.click();
      await new Promise((resolve) => setTimeout(resolve, 150));
      return { ok: pinInput.type === 'text', inputType: pinInput.type };
    })()`,
  );

  if (!hydrationProbe.ok) {
    throw new Error(
      `Reveal playback controls did not hydrate. ${hydrationProbe.reason ?? `PIN type stayed ${hydrationProbe.inputType}`}`,
    );
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const buttonBox = await evaluate(
      client,
      `(() => {
        const button = Array.from(document.querySelectorAll('button')).find((item) =>
          item.textContent?.includes('Unlock Playback') || item.textContent?.includes('Opening...')
        );
        if (!button) return { ok: true, state: 'already-unlocked' };
        if (button.disabled && button.textContent?.includes('Opening...')) {
          return { ok: true, state: 'opening' };
        }
        if (button.disabled) return { ok: false, reason: 'Unlock Playback button is disabled' };
        button.scrollIntoView({ block: 'center', inline: 'center' });
        button.focus();
        button.click();
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        const rect = button.getBoundingClientRect();
        return {
          ok: true,
          state: button.textContent?.trim() ?? '',
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      })()`,
    );

    if (!buttonBox.ok) {
      throw new Error(buttonBox.reason ?? "Unable to unlock demo reveal.");
    }

    lastButtonState = buttonBox.state ?? "";

    if (buttonBox.state?.includes("Unlock Playback")) {
      await client.send("Input.dispatchMouseEvent", {
        button: "left",
        buttons: 1,
        clickCount: 1,
        type: "mousePressed",
        x: buttonBox.x,
        y: buttonBox.y,
      });
      await client.send("Input.dispatchMouseEvent", {
        button: "left",
        buttons: 0,
        clickCount: 1,
        type: "mouseReleased",
        x: buttonBox.x,
        y: buttonBox.y,
      });
    }

    lastText = await evaluate(client, "document.body.innerText");
    const bodyText = lastText ?? "";

    missingMarkers = requiredMarkers.filter((marker) =>
      !bodyText.toLowerCase().includes(marker.toLowerCase()),
    );
    if (missingMarkers.length === 0) {
      console.log(`PASS /reveal recipient playback unlock -> ${new URL("/reveal?code=AWO-DEMO-001&demo=1", baseUrl)}`);
      return;
    }

    if (bodyText.includes("That code and PIN could not be verified")) {
      throw new Error("Demo reveal credentials were rejected.");
    }

    if (bodyText.includes("Reveal validation is temporarily unavailable")) {
      throw new Error("Demo reveal validation endpoint is unavailable.");
    }

    await sleep(100);
  }

  throw new Error(
    `Demo reveal playback did not show the expected proof sections. button=${lastButtonState} missing=${missingMarkers.join(", ")} diagnostics=${diagnostics.slice(-3).join(" | ")} text=${(lastText ?? "").slice(0, 420)}`,
  );
}

async function verifyCartControls(client) {
  const cartLoad = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: new URL("/cart", baseUrl).toString() });
  await cartLoad;

  await evaluate(
    client,
    `(() => {
      localStorage.setItem('awo_demo_cart', JSON.stringify([{
        artistName: 'HatchVision Studio',
        currency: 'USD',
        priceCents: 550,
        quantity: 1,
        slug: 'wildflower-notes',
        title: 'Wildflower Notes'
      }]));
      window.dispatchEvent(new Event('awo-cart-updated'));
    })()`,
  );

  const reload = client.waitFor("Page.loadEventFired");
  await client.send("Page.reload");
  await reload;
  await sleep(250);

  const plusResult = await evaluate(
    client,
    `(async () => {
      const button = Array.from(document.querySelectorAll('button')).find((item) =>
        item.getAttribute('aria-label') === 'Increase Wildflower Notes quantity'
      );
      if (!button) return { ok: false, reason: 'Increase quantity button not found' };
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const input = document.querySelector('input[aria-label="Wildflower Notes quantity"]');
      return { ok: input?.value === '2', value: input?.value ?? '' };
    })()`,
  );

  if (!plusResult.ok) {
    throw new Error(plusResult.reason ?? `Cart quantity did not update: ${plusResult.value}`);
  }

  const removeResult = await evaluate(
    client,
    `(async () => {
      const button = Array.from(document.querySelectorAll('button')).find((item) =>
        item.textContent?.trim() === 'Remove'
      );
      if (!button) return { ok: false, reason: 'Remove button not found' };
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        ok: document.body.innerText.includes('Your Cart Is Empty'),
        text: document.body.innerText.slice(0, 500)
      };
    })()`,
  );

  if (!removeResult.ok) {
    throw new Error(removeResult.reason ?? "Cart remove did not empty the cart.");
  }

  console.log(`PASS /cart quantity and remove controls -> ${new URL("/cart", baseUrl)}`);
}

async function verifyCartStorageRecovery(client) {
  const cartLoad = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: new URL("/cart", baseUrl).toString() });
  await cartLoad;

  await evaluate(
    client,
    `(() => {
      localStorage.setItem('awo_demo_cart', JSON.stringify([
        { title: 'Broken Card', quantity: 'two' },
        null
      ]));
      window.dispatchEvent(new Event('awo-cart-updated'));
    })()`,
  );

  const reload = client.waitFor("Page.loadEventFired");
  await client.send("Page.reload");
  await reload;

  let lastState = { bodyText: "", cart: "" };
  for (let attempt = 0; attempt < 50; attempt += 1) {
    lastState = await evaluate(
      client,
      `(() => ({
        bodyText: document.body.innerText,
        cart: localStorage.getItem('awo_demo_cart')
      }))()`,
    );
    const normalizedText = (lastState.bodyText ?? "").toLowerCase();
    if (
      normalizedText.includes("your cart is empty") &&
      lastState.cart === null &&
      !normalizedText.includes("this page couldn't load")
    ) {
      console.log(`PASS /cart malformed storage recovery -> ${new URL("/cart", baseUrl)}`);
      return;
    }

    await sleep(100);
  }

  throw new Error(
    `Cart page did not recover cleanly from malformed cart storage. cart=${lastState.cart ?? "null"} text=${(lastState.bodyText ?? "").slice(0, 160)}`,
  );
}

async function verifyAccountSessionRecovery(client) {
  const accountLoad = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: new URL("/account", baseUrl).toString() });
  await accountLoad;

  await evaluate(
    client,
    `(() => {
      localStorage.setItem('awo_buyer_session', JSON.stringify({
        access_token: '',
        token_type: '',
        user: {}
      }));
    })()`,
  );

  const reload = client.waitFor("Page.loadEventFired");
  await client.send("Page.reload");
  await reload;

  let lastState = { bodyText: "", session: "" };
  for (let attempt = 0; attempt < 50; attempt += 1) {
    lastState = await evaluate(
      client,
      `(() => ({
        bodyText: document.body.innerText,
        session: localStorage.getItem('awo_buyer_session')
      }))()`,
    );

    const bodyText = lastState.bodyText ?? "";
    const normalizedText = bodyText.toLowerCase();
    if (
      normalizedText.includes("sign in to awo") &&
      normalizedText.includes("create account") &&
      lastState.session === null &&
      !normalizedText.includes("this page couldn't load")
    ) {
      console.log(`PASS /account stale session recovery -> ${new URL("/account", baseUrl)}`);
      return;
    }

    await sleep(100);
  }

  throw new Error(
    `Account page did not recover cleanly from a stale buyer session. session=${lastState.session ?? "null"} text=${(lastState.bodyText ?? "").slice(0, 160)}`,
  );
}

async function verifyStorefrontNavigation(client) {
  const routes = [
    { marker: "ArtWithOrigin", path: "/" },
    { marker: "Shop", path: "/shop" },
    { marker: "Artists", path: "/artists" },
    { marker: "Reveal", path: "/reveal" },
    { marker: "People", path: "/people" },
    { marker: "Reminders", path: "/reminders" },
    { marker: "Your Cart", path: "/cart" },
    { marker: "Sign in to AWO", path: "/account" },
  ];

  for (const route of routes) {
    const load = client.waitFor("Page.loadEventFired");
    await client.send("Page.navigate", { url: new URL(route.path, baseUrl).toString() });
    await load;

    let lastText = "";
    for (let attempt = 0; attempt < 50; attempt += 1) {
      lastText = await evaluate(client, "document.body.innerText");
      const normalizedText = (lastText ?? "").toLowerCase();
      if (
        normalizedText.includes(route.marker.toLowerCase()) &&
        !normalizedText.includes("404") &&
        !normalizedText.includes("not_found") &&
        !normalizedText.includes("this page couldn't load")
      ) {
        console.log(`PASS ${route.path} storefront navigation -> ${new URL(route.path, baseUrl)}`);
        break;
      }

      if (attempt === 49) {
        throw new Error(
          `${route.path} did not render expected navigation marker "${route.marker}". text=${(lastText ?? "").slice(0, 160)}`,
        );
      }

      await sleep(100);
    }
  }
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

    const revealLoad = client.waitFor("Page.loadEventFired");
    await client.send("Page.navigate", { url: new URL("/demo", baseUrl).toString() });
    await revealLoad;
    await sleep(250);

    const revealClickResult = await evaluate(
      client,
      `(async () => {
        const link = Array.from(document.querySelectorAll('a')).find((item) =>
          item.textContent?.includes('Open Demo Reveal')
        );
        if (!link) return { ok: false, reason: 'Open Demo Reveal link not found' };
        return { ok: link.getAttribute('href') === '/reveal?code=AWO-DEMO-001&demo=1', href: link.getAttribute('href') };
      })()`,
    );

    if (!revealClickResult.ok) {
      throw new Error(revealClickResult.reason ?? `Demo reveal link pointed to ${revealClickResult.href}.`);
    }

    const directRevealLoad = client.waitFor("Page.loadEventFired");
    await client.send("Page.navigate", {
      url: new URL("/reveal?code=AWO-DEMO-001&demo=1", baseUrl).toString(),
    });
    await directRevealLoad;
    await sleep(250);

    const revealState = await waitForRevealDemoState(client);
    console.log(`PASS /demo guided reveal -> ${revealState.url}`);
    await verifyRevealApi(client);
    await unlockDemoReveal(client);

    await verifyCartControls(client);
    await verifyCartStorageRecovery(client);
    await verifyAccountSessionRecovery(client);
    await verifyStorefrontNavigation(client);
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
