/**
 * Initiate Gmail OAuth for a specific agent.
 *
 *   GET /console/connections/gmail/start?agent_id=<uuid>
 *
 * The Connect Gmail button in the Connections tab is just a link to this URL.
 * We verify the user is signed in and is a member of the agent's org, sign a
 * short-lived state token (CSRF + carries agent_id/user_id), then 302 to
 * Google's consent screen. After Cooper consents, Google redirects to
 * /console/connections/gmail/callback with code + state.
 */

import { NextRequest, NextResponse } from "next/server";

import { signState } from "@/lib/oauth-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email", // gives us the email in id_token
  "openid",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agent_id");
  if (!agentId) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = `/console/connections/gmail/start?agent_id=${encodeURIComponent(agentId)}`;
    return NextResponse.redirect(
      new URL(`/console/login?next=${encodeURIComponent(next)}`, req.url)
    );
  }

  // RLS-scoped read confirms membership: if the user isn't in the agent's org,
  // this returns nothing and we 403.
  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("id, org_id, name")
    .eq("id", agentId)
    .single();
  if (agentErr || !agent) {
    return NextResponse.json(
      { error: "Agent not found or you don't have access" },
      { status: 404 }
    );
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "Google OAuth not configured on the server (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_REDIRECT_URI).",
      },
      { status: 500 }
    );
  }

  const state = signState({ agent_id: agent.id, user_id: user.id });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // get a refresh_token, not just access_token
    prompt: "consent", // force consent screen each time → guaranteed refresh_token
    include_granted_scopes: "true",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
