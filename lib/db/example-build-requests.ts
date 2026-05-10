/**
 * Shared queue helpers for the Gmail → knowledge_examples build pipeline.
 *
 * Used by app/console/agents/[id]/actions.ts to enqueue / cancel / dismiss
 * build jobs. The Hetzner daemon (example_requests.py) is the only writer
 * that mutates pending → running → done|failed.
 */

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const DEFAULT_LOOKBACK_DAYS = 90;
const HARD_MAX_LOOKBACK_DAYS = 365;
const DEFAULT_MAX_EXAMPLES = 25;
const HARD_MAX_EXAMPLES = 100;

export type EnqueueExampleBuildInput = {
  orgId: string;
  agentId: string;
  lookbackDays?: number;
  maxExamples?: number;
};

export type EnqueueExampleBuildResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

export async function enqueueExampleBuildRequest(
  input: EnqueueExampleBuildInput
): Promise<EnqueueExampleBuildResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase isn't connected." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // RLS read-gate confirms the user belongs to this org + agent.
  const { data: agent } = await supabase
    .from("agents")
    .select("id, org_id, config")
    .eq("id", input.agentId)
    .maybeSingle();
  if (!agent || agent.org_id !== input.orgId) {
    return { ok: false, error: "Agent not in this org." };
  }

  // Preflight: Gmail must be connected (encrypted refresh token present).
  // Same shape isGmailConnected uses in ConnectionsTab.
  const config = (agent.config ?? {}) as Record<string, unknown>;
  const gmail = (config.gmail as Record<string, unknown> | undefined) ?? {};
  const refreshTokenEncrypted = gmail.refresh_token_encrypted;
  if (
    typeof refreshTokenEncrypted !== "string" ||
    refreshTokenEncrypted.length === 0
  ) {
    return {
      ok: false,
      error: "Connect Gmail on this agent first, then try again.",
    };
  }

  // Block if a run is already in flight for this agent.
  const { data: inflight } = await supabase
    .from("example_build_requests")
    .select("id")
    .eq("agent_id", input.agentId)
    .in("status", ["pending", "running"])
    .limit(1);
  if (inflight && inflight.length > 0) {
    return {
      ok: false,
      error: "A build is already running for this agent. Wait for it to finish.",
    };
  }

  const lookbackDays = Math.max(
    1,
    Math.min(input.lookbackDays ?? DEFAULT_LOOKBACK_DAYS, HARD_MAX_LOOKBACK_DAYS)
  );
  const maxExamples = Math.max(
    1,
    Math.min(input.maxExamples ?? DEFAULT_MAX_EXAMPLES, HARD_MAX_EXAMPLES)
  );

  const admin = createSupabaseServiceRoleClient();
  const { data: row, error } = await admin
    .from("example_build_requests")
    .insert({
      org_id: input.orgId,
      agent_id: input.agentId,
      lookback_days: lookbackDays,
      max_examples: maxExamples,
      requested_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !row) {
    return {
      ok: false,
      error: error?.message ?? "Failed to queue example build.",
    };
  }
  return { ok: true, requestId: row.id as string };
}

export type CancelExampleBuildInput = { requestId: string };
export type CancelExampleBuildResult = { ok: true } | { ok: false; error: string };

export async function cancelExampleBuildRequestById(
  input: CancelExampleBuildInput
): Promise<CancelExampleBuildResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase isn't connected." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row } = await supabase
    .from("example_build_requests")
    .select("id, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Request not found or no access." };
  if (row.status !== "pending") {
    return { ok: false, error: `Cannot cancel a ${row.status} request.` };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("example_build_requests")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending"); // race-safe vs. daemon claim
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Hard-delete a terminal-state row (done / failed / cancelled). Used for the
 * "Dismiss" button on the status row so users can clean up after themselves.
 */
export async function dismissExampleBuildRequestById(
  input: CancelExampleBuildInput
): Promise<CancelExampleBuildResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase isn't connected." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row } = await supabase
    .from("example_build_requests")
    .select("id, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Request not found or no access." };

  const TERMINAL: Array<typeof row.status> = ["done", "failed", "cancelled"];
  if (!TERMINAL.includes(row.status)) {
    return { ok: false, error: "Use Cancel for in-flight builds, not Dismiss." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("example_build_requests")
    .delete()
    .eq("id", input.requestId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
