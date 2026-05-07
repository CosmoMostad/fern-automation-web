/**
 * HMAC-signed state for the Gmail OAuth flow — CSRF protection + binds
 * the callback to the agent + user that initiated it.
 *
 * Encoded form:  base64url(JSON.stringify(payload)) + "." + base64url(hmac)
 *
 * The signing secret (OAUTH_STATE_SECRET env var) is independent of the
 * token encryption key. Rotating either is safe; rotating both is also safe.
 */
import crypto from "node:crypto";

const STATE_TTL_SEC = 5 * 60; // 5 minutes — Google flows complete in seconds

export type OAuthStatePayload = {
  agent_id: string;
  user_id: string;
  nonce: string;
  exp: number; // unix seconds
};

function getSecret(): string {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "OAUTH_STATE_SECRET not set or too short. Generate with `openssl rand -base64 32`."
    );
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signState(input: { agent_id: string; user_id: string }): string {
  const payload: OAuthStatePayload = {
    agent_id: input.agent_id,
    user_id: input.user_id,
    nonce: crypto.randomBytes(16).toString("hex"),
    exp: Math.floor(Date.now() / 1000) + STATE_TTL_SEC,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export function verifyState(state: string): OAuthStatePayload {
  const parts = state.split(".");
  if (parts.length !== 2) {
    throw new Error("Malformed state — expected body.signature");
  }
  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest();
  const provided = fromB64url(sig);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error("State signature mismatch");
  }
  const payload = JSON.parse(fromB64url(body).toString("utf8")) as OAuthStatePayload;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("State expired — restart the connect flow");
  }
  return payload;
}
