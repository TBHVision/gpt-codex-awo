export const adminCookieName = "awo_admin_session";
export const adminUserCookieName = "awo_admin_user_id";

const signatureSeparator = ".";

function getBase64Url(bytes: ArrayBuffer) {
  const binary = Array.from(new Uint8Array(bytes), (byte) =>
    String.fromCharCode(byte),
  ).join("");
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getSignature(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );

  return getBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

export function temporaryPasswordEnabled() {
  return process.env.AWO_DISABLE_TEMP_ADMIN_PASSWORD !== "true";
}

export function getAdminSessionToken() {
  return process.env.AWO_ADMIN_SESSION_TOKEN ?? process.env.AWO_ADMIN_PASSWORD;
}

export async function signAdminUserCookie(userId: string, secret: string) {
  const signature = await getSignature(userId, secret);

  return `${userId}${signatureSeparator}${signature}`;
}

export async function verifyAdminUserCookie(
  value: string | undefined,
  secret = getAdminSessionToken(),
) {
  if (!value || !secret) {
    return null;
  }

  const separatorIndex = value.lastIndexOf(signatureSeparator);

  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null;
  }

  const userId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expectedSignature = await getSignature(userId, secret);

  return timingSafeEqual(signature, expectedSignature) ? userId : null;
}
