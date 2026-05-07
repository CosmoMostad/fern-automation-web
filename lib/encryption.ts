/**
 * AES-256-GCM symmetric encryption for tokens stored in Supabase.
 *
 * Used to wrap Google OAuth refresh tokens before they land in
 * `agents.config.gmail.refresh_token_encrypted` JSONB. The same key
 * (GMAIL_TOKEN_ENC_KEY env var, base64-encoded 32 bytes) is shared with
 * the Hetzner runtime in shared/encryption.py — encrypt-on-Vercel,
 * decrypt-on-Hetzner.
 *
 * Storage format:  "v1:" + base64( iv(12) ‖ ciphertext ‖ tag(16) )
 *
 * The version prefix lets us rotate keys later by introducing v2 alongside.
 */
import crypto from "node:crypto";

const VERSION = "v1";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const b64 = process.env.GMAIL_TOKEN_ENC_KEY;
  if (!b64) {
    throw new Error(
      "GMAIL_TOKEN_ENC_KEY not set. Generate with `openssl rand -base64 32` and set in Vercel env (Production + Preview)."
    );
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error(
      `GMAIL_TOKEN_ENC_KEY must be 32 bytes after base64 decode (got ${key.length}).`
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, ct, tag]);
  return `${VERSION}:${combined.toString("base64")}`;
}

export function decryptToken(encrypted: string): string {
  if (!encrypted.startsWith(`${VERSION}:`)) {
    throw new Error(`Unsupported encryption version: ${encrypted.slice(0, 4)}`);
  }
  const key = getKey();
  const data = Buffer.from(encrypted.slice(VERSION.length + 1), "base64");
  if (data.length < IV_LEN + TAG_LEN) {
    throw new Error("Encrypted blob too short — corrupted or truncated.");
  }
  const iv = data.subarray(0, IV_LEN);
  const tag = data.subarray(data.length - TAG_LEN);
  const ct = data.subarray(IV_LEN, data.length - TAG_LEN);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
