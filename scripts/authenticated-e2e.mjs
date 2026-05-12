import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    try {
      const file = readFileSync(path.join(process.cwd(), fileName), "utf8");
      for (const line of file.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
          continue;
        }
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        const rawValue = trimmed.slice(index + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // The script also runs in CI where values are injected directly.
    }
  }
}

loadLocalEnv();

const baseUrl = process.env.AWO_QA_BASE_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const buyerEmail = `awo-e2e-buyer-${runId}@example.test`;
const adminEmail = `awo-e2e-admin-${runId}@example.test`;
const password = `AWO-e2e-${runId}!`;

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

  throw new Error("Chrome was not found. Set CHROME_PATH to run authenticated E2E QA.");
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

function serviceHeaders(extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function anonHeaders(token, extra = {}) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${token ?? anonKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function readJson(response, fallback) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${fallback}: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function createUser(email, userPassword, metadata = {}) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    body: JSON.stringify({
      email,
      email_confirm: true,
      password: userPassword,
      user_metadata: metadata,
    }),
    headers: serviceHeaders(),
    method: "POST",
  });
  const payload = await readJson(response, `Unable to create auth user ${email}`);

  return payload.user ?? payload;
}

async function deleteUser(userId) {
  if (!userId) {
    return;
  }

  await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: serviceHeaders(),
    method: "DELETE",
  });
}

async function ensureProfile(user, role) {
  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=id&id=eq.${user.id}&limit=1`,
    {
      headers: serviceHeaders(),
    },
  );
  const existingRows = await readJson(existingResponse, "Unable to inspect test profile");

  if (existingRows.length === 0) {
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      body: JSON.stringify({
        display_name: user.user_metadata?.display_name ?? null,
        email: user.email,
        id: user.id,
        role,
      }),
      headers: serviceHeaders({ Prefer: "return=minimal" }),
      method: "POST",
    });
    await readJson(insertResponse, "Unable to create test profile");
    return;
  }

  const patchResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
    body: JSON.stringify({ role }),
    headers: serviceHeaders({ Prefer: "return=minimal" }),
    method: "PATCH",
  });
  await readJson(patchResponse, "Unable to update test profile");
}

async function signIn(email, userPassword) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    body: JSON.stringify({
      email,
      password: userPassword,
    }),
    headers: anonHeaders(),
    method: "POST",
  });

  return readJson(response, `Unable to sign in ${email}`);
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
  };
}

async function createTab(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new`, {
    method: "PUT",
  });

  return readJson(response, "Unable to create Chrome tab");
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

async function navigate(client, pathName) {
  const url = new URL(pathName, baseUrl).toString();
  await client.send("Page.navigate", { url });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const state = await evaluate(
      client,
      `({ href: location.href, readyState: document.readyState })`,
    );
    if ((state.href === url || state.href.startsWith(url)) && state.readyState !== "loading") {
      return;
    }
    await sleep(100);
  }
}

async function waitForText(client, marker, label) {
  let lastText = "";
  let reloads = 0;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    lastText = await evaluate(client, "document.body.innerText");
    if ((lastText ?? "").includes(marker)) {
      return;
    }
    if (
      (lastText ?? "").includes("This page couldn't load") ||
      (lastText ?? "").includes("This page couldn’t load")
    ) {
      if (reloads < 2) {
        reloads += 1;
        await client.send("Page.reload");
        await sleep(300);
        continue;
      }
      throw new Error(`${label} rendered the browser error page.`);
    }
    await sleep(100);
  }

  throw new Error(`${label} did not show "${marker}". text=${(lastText ?? "").slice(0, 320)}`);
}

function setValueScript(selector, value) {
  return `
    (() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return false;
      const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
      setter?.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `;
}

async function setValue(client, selector, value, label) {
  const ok = await evaluate(client, setValueScript(selector, value));
  if (!ok) {
    throw new Error(`${label} input was not found.`);
  }
}

async function clickButton(client, text, label) {
  const ok = await evaluate(
    client,
    `
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((item) =>
          item.textContent?.trim().includes(${JSON.stringify(text)})
        );
        if (!button || button.disabled) return false;
        button.click();
        return true;
      })()
    `,
  );

  if (!ok) {
    throw new Error(`${label} button "${text}" was not clickable.`);
  }
}

async function setBuyerSession(client, session) {
  const storageSession = {
    access_token: session.access_token,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    token_type: session.token_type ?? "bearer",
    user: {
      email: session.user?.email,
      id: session.user?.id,
    },
  };

  if (!storageSession.access_token || !storageSession.user.id) {
    throw new Error("Supabase session payload is missing fields required by the app.");
  }

  await evaluate(
    client,
    `localStorage.setItem('awo_buyer_session', ${JSON.stringify(JSON.stringify(storageSession))})`,
  );
}

async function runBuyerFlow(client, buyerSession) {
  await navigate(client, "/account");
  await setBuyerSession(client, buyerSession);
  await client.send("Page.reload");
  await waitForText(client, "Account Connected", "/account authenticated buyer");
  await waitForText(client, buyerEmail, "/account authenticated buyer email");
  console.log("PASS authenticated buyer account loads saved session");

  await navigate(client, "/people");
  await waitForText(client, "Using Supabase account storage.", "/people authenticated load");
  await setValue(client, 'input[placeholder="Recipient name"]', "E2E Recipient", "/people name");
  await setValue(client, 'input[placeholder="Family, friend, customer..."]', "Friend", "/people relationship");
  await setValue(client, 'input[placeholder="Birthday, thanks, support..."]', "Launch Thank You", "/people occasion");
  await clickButton(client, "Add Person", "/people");
  await waitForText(client, "Saved person and first reminder to Supabase.", "/people save");
  console.log("PASS authenticated buyer saves people/reminder seed");

  await navigate(client, "/reminders");
  await waitForText(client, "Using Supabase account storage.", "/reminders authenticated load");
  await setValue(client, 'input[placeholder="Recipient name"]', "E2E Reminder Recipient", "/reminders person");
  await setValue(client, 'input[placeholder="Birthday, thanks, renewal..."]', "Renewal Gift", "/reminders occasion");
  await clickButton(client, "Add Reminder", "/reminders");
  await waitForText(client, "Saved reminder to Supabase.", "/reminders save");
  await verifyBuyerPlanningRows(buyerSession);
  console.log("PASS authenticated reminders save account-backed reminder");

  await navigate(client, "/studio");
  await waitForText(client, "Request Artist Review", "/studio artist application");
  await setValue(client, 'input[placeholder="Artist or studio name"]', `E2E Artist ${runId}`, "/studio artist name");
  await setValue(client, 'input[placeholder="artist@example.com"]', `artist-${runId}@example.com`, "/studio artist contact");
  await setValue(client, 'input[placeholder="Watercolor, ink, collage..."]', "Watercolor and ink", "/studio artist medium");
  await setValue(client, 'input[placeholder="https://..."]', `https://example.com/e2e-artist-${runId}`, "/studio artist portfolio");
  await setValue(client, "textarea", "Automated test artist profile for AWO authenticated regression coverage.", "/studio artist story");
  await setValue(
    client,
    'textarea[placeholder="Confirm this is your human-made work and how you document creation."]',
    "I confirm these are human-made test works with process notes and provenance documentation.",
    "/studio artist origin statement",
  );
  const termsChecked = await evaluate(
    client,
    `
      (() => {
        const checkbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find((item) =>
          item.closest('label')?.textContent?.includes('commercial terms')
        );
        if (!checkbox) return false;
        if (!checkbox.checked) checkbox.click();
        return true;
      })()
    `,
  );
  if (!termsChecked) {
    throw new Error("/studio artist commercial terms checkbox was not clickable.");
  }
  await clickButton(client, "Submit For Review", "/studio");
  await waitForText(client, "Submitted E2E Artist", "/studio artist application submit");
  console.log("PASS authenticated artist application submits as pending review");
}

async function runBuyerSignupConfirmationFlow(client) {
  await navigate(client, "/account");
  await evaluate(
    client,
    `
      (() => {
        localStorage.removeItem('awo_buyer_session');
      })()
    `,
  );
  await client.send("Page.reload");
  await waitForText(client, "Sign in to AWO", "/account signup clean session");
  await evaluate(
    client,
    `
      (() => {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input, init) => {
          const url = typeof input === 'string' ? input : input?.url ?? '';
          if (url.includes('/auth/v1/signup')) {
            return new Response(JSON.stringify({
              user: {
                email: 'needs-confirmation@example.test',
                id: '00000000-0000-4000-8000-000000000000'
              }
            }), {
              headers: { 'content-type': 'application/json' },
              status: 200
            });
          }
          return originalFetch(input, init);
        };
      })()
    `,
  );
  await clickButton(client, "Create Account", "/account signup toggle");
  await setValue(client, "#display-name", "Confirmation Needed", "/account signup name");
  await setValue(client, "#buyer-email", "needs-confirmation@example.test", "/account signup email");
  await setValue(client, "#buyer-password", "AWO-confirmation-1!", "/account signup password");
  await clickButton(client, "Create Buyer Account", "/account signup submit");
  await waitForText(
    client,
    "Account created, but Supabase requires email confirmation before sign-in.",
    "/account signup confirmation notice",
  );
  await waitForText(client, "Sign In", "/account returns to sign in");
  console.log("PASS buyer signup email-confirmation state stays on account page");
}

async function verifyBuyerPlanningRows(session) {
  const [peopleResponse, occasionsResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/people?select=display_name&order=created_at.asc`, {
      headers: anonHeaders(session.access_token),
    }),
    fetch(`${supabaseUrl}/rest/v1/occasions?select=title&order=created_at.asc`, {
      headers: anonHeaders(session.access_token),
    }),
  ]);
  const [people, occasions] = await Promise.all([
    readJson(peopleResponse, "Unable to verify authenticated people rows"),
    readJson(occasionsResponse, "Unable to verify authenticated occasion rows"),
  ]);

  const names = new Set(people.map((person) => person.display_name));
  const titles = new Set(occasions.map((occasion) => occasion.title));

  if (!names.has("E2E Recipient") || !names.has("E2E Reminder Recipient")) {
    throw new Error("Authenticated people rows were not persisted as expected.");
  }

  if (!titles.has("Launch Thank You") || !titles.has("Renewal Gift")) {
    throw new Error("Authenticated occasion rows were not persisted as expected.");
  }
}

async function runAdminFlow(client, adminSession) {
  await navigate(client, "/account");
  await setBuyerSession(client, adminSession);
  await navigate(client, "/admin/login?next=%2Fadmin%2Freviews");
  await waitForText(client, "Admin Access", "/admin/login");
  await setValue(client, "#admin-email", adminEmail, "/admin/login email");
  await setValue(client, "#admin-password", password, "/admin/login password");
  await clickButton(client, "Sign in as Admin", "/admin/login");
  await waitForText(client, "Admin Review Queues", "/admin/reviews");
  await waitForText(client, "E2E Artist", "/admin/reviews pending artist");
  await approvePendingArtist(client);
  await verifyArtistApproved(adminSession.user.id);
  console.log("PASS named admin login approves pending artist");

  await navigate(client, "/admin/fulfillment");
  await waitForText(client, "Fulfillment Queue", "/admin/fulfillment named admin");
  await waitForText(client, "Actions:", "/admin/fulfillment named admin actions posture");
  await navigate(client, "/admin/ownership");
  await waitForText(client, "Ownership Records", "/admin/ownership named admin");
  await waitForText(client, "Actions:", "/admin/ownership named admin actions posture");
  console.log("PASS named admin can inspect lifecycle operator pages");
}

async function approvePendingArtist(client) {
  const ok = await evaluate(
    client,
    `
      (() => {
        const targetName = ${JSON.stringify(`E2E Artist ${runId}`)};
        const heading = Array.from(document.querySelectorAll('h3')).find((item) =>
          item.textContent?.trim() === targetName
        );
        const container = heading?.closest('article');
        if (!container) return false;
        const button = Array.from(container.querySelectorAll('button')).find((item) =>
          item.textContent?.trim().includes('Approve')
        );
        if (!button || button.disabled) return false;
        button.click();
        return true;
      })()
    `,
  );

  if (!ok) {
    throw new Error("/admin/reviews pending E2E artist approve button was not clickable.");
  }
}

async function verifyArtistApproved(adminUserId) {
  let artist;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const artistResponse = await fetch(
      `${supabaseUrl}/rest/v1/artists?select=id,status,application_contact_email,application_medium,application_origin_statement,commercial_terms_acknowledged,reviewed_at,reviewed_by_profile_id&public_name=eq.${encodeURIComponent(`E2E Artist ${runId}`)}&limit=1`,
      {
        headers: serviceHeaders(),
      },
    );
    [artist] = await readJson(artistResponse, "Unable to verify approved artist row");

    if (artist?.status === "approved") {
      break;
    }

    await sleep(250);
  }

  if (artist?.status !== "approved") {
    throw new Error(`Artist review action did not approve the pending artist. status=${artist?.status ?? "missing"}`);
  }

  if (
    artist.application_contact_email !== `artist-${runId}@example.com` ||
    artist.application_medium !== "Watercolor and ink" ||
    !artist.application_origin_statement?.includes("human-made test works") ||
    artist.commercial_terms_acknowledged !== true ||
    !artist.reviewed_at ||
    artist.reviewed_by_profile_id !== adminUserId
  ) {
    throw new Error("Artist application packet or review metadata was not persisted.");
  }

  const auditResponse = await fetch(
    `${supabaseUrl}/rest/v1/admin_audit_events?select=id&entity_table=eq.artists&entity_id=eq.${artist.id}&action=eq.artist_approved&limit=1`,
    {
      headers: serviceHeaders(),
    },
  );
  const auditRows = await readJson(auditResponse, "Unable to verify artist approval audit event");

  if (auditRows.length === 0) {
    throw new Error("Artist approval audit event was not written.");
  }
}

async function main() {
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    console.log(`SKIP authenticated E2E -> missing ${missing.join(", ")}`);
    return;
  }

  const chrome = await findChrome();
  const userDataDir = await mkdtemp(path.join(tmpdir(), "awo-auth-e2e-"));
  const port = 9231;
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

  let buyerUser = null;
  let adminUser = null;
  let client = null;

  try {
    buyerUser = await createUser(buyerEmail, password, { display_name: "AWO E2E Buyer" });
    adminUser = await createUser(adminEmail, password, { display_name: "AWO E2E Admin" });
    await ensureProfile(buyerUser, "buyer");
    await ensureProfile(adminUser, "admin");

    const buyerSession = await signIn(buyerEmail, password);
    const adminSession = await signIn(adminEmail, password);

    await waitForEndpoint(port);
    const tab = await createTab(port);
    client = createCdpClient(tab.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    await runBuyerFlow(client, buyerSession);
    await runBuyerSignupConfirmationFlow(client);
    await runAdminFlow(client, adminSession);
  } finally {
    if (client) {
      await client.close();
    }
    chromeProcess.kill();
    await deleteUser(buyerUser?.id);
    await deleteUser(adminUser?.id);
    await sleep(500);
    await rmWithRetry(userDataDir);
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
