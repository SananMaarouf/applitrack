/**
 * Attachment storage on R2.
 *
 * Objects stay private in the bucket; downloads go through the Worker with a
 * short-lived signed query string, so the browser needs no Authorization
 * header (the frontend opens the URL in a new tab).
 */

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const ALLOWED_CONTENT_TYPE = "application/pdf";
const URL_TTL_SECONDS = 5 * 60;

export function sanitizeFilename(name: string): string {
  const safe = Array.from(name)
    .filter((char) => /[A-Za-z0-9._-]/.test(char))
    .join("");
  const base = safe || "attachment.pdf";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

export function attachmentKey(userId: string, applicationId: number, filename: string): string {
  return `attachments/${userId}/${applicationId}/${sanitizeFilename(filename)}`;
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

/** Build the same-origin URL the frontend opens to download an attachment. */
export async function signAttachmentUrl(
  secret: string,
  applicationId: number,
  now: number = Date.now(),
): Promise<string> {
  const expires = Math.floor(now / 1000) + URL_TTL_SECONDS;
  const signature = await signPayload(`${applicationId}:${expires}`, secret);
  return `/api/attachments/${applicationId}?exp=${expires}&sig=${signature}`;
}

export async function verifyAttachmentSignature(
  secret: string,
  applicationId: number,
  expires: number,
  signature: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!Number.isFinite(expires) || expires * 1000 < now) return false;
  const expected = await signPayload(`${applicationId}:${expires}`, secret);
  return constantTimeEqual(expected, signature);
}
