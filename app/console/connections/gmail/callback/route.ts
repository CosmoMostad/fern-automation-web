/**
 * Gmail OAuth callback — Google redirects Cooper here after he clicks Allow.
 *
 *   GET /console/connections/gmail/callback?code=<...>&state=<...>
 *
 * Steps:
 *   1. Verify the state HMAC (CSRF, expiry, agent_id binding).
 *   2. Exchange the auth code for tokens via Google's token endpoint.
 *   3. Decode the id_token to learn the connected Gmail address.
 *   4. Encrypt the refresh_token with our shared key (GMAIL_TOKEN_ENC_KEY).
 *   5. Merge into agents.config.gmail JSONB (preserves other settings).
 *   6. Redirect back to the agent page with a success flag.
 *
 * Error paths land at /console/agents/<id>?gmail=error&reason=... so the
 * Connections tab can surface a clear failure message.
 */

import { NextRequest, NextResponse } from "next/server";

import { encryptToken } from "@/lib/encryption";
import { verifyState } from "@/lib/oauth-state";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
};

function decodeIdTokenEmail(idToken: string): string | null {
  // id_token is a JWT — header.payload.signature — we trust the payload
  // because we just received it server-to-server from Google over HTTPS.
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const json = Buffer.from(
      padded.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json) as { email?: string; email_verified?: boolean };
    if (payload.email_verified === false) return null;
    return payload.email ?? null;
  } catch {
    return null;
  }
}

function errorRedirect(req: NextRequest, agentId: string | null, reason: string) {
  const target = agentId
    ? `/console/agents/${agentId}?gmail=error&reason=${encodeURIComponent(reason)}`
    : `/console?gmail=error&reason=${encodeURIComponent(reason)}`;
  return NextResponse.redirect(new URL(target, req.url));
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const googleError = req.nextUrl.searchParams.get("error");

  if (googleError) {
    // User clicked Cancel on Google's consent screen, or a deeper Google error.
    return errorRedirect(req, null, googleError);
  }
  if (!code || !state) {
    return errorRedirect(req, null, "missing_code_or_state");
  }

  // 1. Verify the state HMAC + extract agent_id / user_id.
  let payload;
  try {
    payload = verifyState(state);
  } catch (e) {
    return errorRedirect(req, null, "state_invalid");
  }
  const { agent_id, user_id } = payload;

  // Defense in depth: confirm the signed-in user matches the one who started.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== user_id) {
    return errorRedirect(req, agent_id, "user_mismatch");
  }

  // 2. Exchange the auth code for tokens.
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return errorRedirect(req, agent_id, "server_oauth_not_configured");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("[gmail/callback] token exchange failed:", tokenRes.status, text);
    return errorRedirect(req, agent_id, "token_exchange_failed");
  }
  const tokens = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokens.refresh_token) {
    // Google won't issue a refresh_token if the user previously consented and
    // we didn't request prompt=consent. We do request it, so this should be rare.
    console.error("[gmail/callback] no refresh_token returned — user may need to revoke prior consent at https://myaccount.google.com/permissions");
    return errorRedirect(req, agent_id, "no_refresh_token");
  }

  // 3. Decode id_token to get the connected email.
  const email = decodeIdTokenEmail(tokens.id_token);
  if (!email) {
    return errorRedirect(req, agent_id, "no_email_in_id_token");
  }

  // 4. Encrypt the refresh_token at rest.
  let refreshTokenEncrypted: string;
  try {
    refreshTokenEncrypted = encryptToken(tokens.refresh_token);
  } catch (e) {
    console.error("[gmail/callback] encryption failed:", e);
    return errorRedirect(req, agent_id, "encryption_failed");
  }

  // 5. Merge into agents.config.gmail. Service-role here because we're writing
  //    a JSONB column; we already authenticated the user above.
  const admin = createSupabaseServiceRoleClient();
  const { data: agentRow, error: readErr } = await admin
    .from("agents")
    .select("config")
    .eq("id", agent_id)
    .single();
  if (readErr || !agentRow) {
    console.error("[gmail/callback] agent read failed:", readErr);
    return errorRedirect(req, agent_id, "agent_read_failed");
  }
  const existing = (agentRow.config ?? {}) as Record<string, unknown>;
  const newConfig = {
    ...existing,
    gmail: {
      account: email,
      refresh_token_encrypted: refreshTokenEncrypted,
      scopes: tokens.scope.split(" "),
      connected_at: new Date().toISOString(),
      connected_by_user_id: user.id,
    },
  };
  const { error: updErr } = await admin
    .from("agents")
    .update({ config: newConfig })
    .eq("id", agent_id);
  if (updErr) {
    console.error("[gmail/callback] agent update failed:", updErr);
    return errorRedirect(req, agent_id, "agent_update_failed");
  }

  // 6. Success → bounce the user back to the Connections tab with a success flag.
  return NextResponse.redirect(
    new URL(`/console/agents/${agent_id}?gmail=connected`, req.url)
  );
}
