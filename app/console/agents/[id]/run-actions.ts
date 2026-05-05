"use server";

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getManifest } from "@/lib/agents/manifest";
import { preflight, type MissingItem } from "@/lib/agents/preflight";

export type EnqueueResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string }
  | { ok: false; error: string; preflightMissing: MissingItem[] };

/**
 * Generic "Run now" trigger. Any agent type wired into the Hetzner
 * dispatch table (run_requests.py) can be triggered through this action.
 *
 * Preflight: before queueing, the agent's manifest is checked against its
 * config + knowledge docs. If anything required is missing, the run is
 * rejected with a structured `preflightMissing` list so the UI can show
 * each missing item with a deep link to the right tab.
 */
export async function enqueueAgentRun(input: {
  agentId: string;
  payload?: Record<string, unknown>;
}): Promise<EnqueueResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: agent } = await supabase
    .from("agents")
    .select("id, org_id, status, config")
    .eq("id", input.agentId)
    .maybeSingle();
  if (!agent) return { ok: false, error: "Agent not found." };

  if (agent.status === "archived") {
    return { ok: false, error: "This agent is archived. Restore it first." };
  }
  if (agent.status === "paused") {
    return { ok: false, error: "This agent is paused. Set status to Live or In-build first." };
  }

  // ─── Preflight ────────────────────────────────────────────────────────────
  const config = (agent.config ?? {}) as Record<string, unknown>;
  const agentType = typeof config.type === "string" ? (config.type as string) : null;
  const manifest = getManifest(agentType);
  if (manifest) {
    const [orgKnowledgeRes, agentKnowledgeRes] = await Promise.all([
      supabase
        .from("knowledge_docs")
        .select("id", { count: "exact", head: true })
        .eq("org_id", agent.org_id)
        .eq("scope", "org"),
      supabase
        .from("knowledge_docs")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", input.agentId)
        .eq("scope", "agent"),
    ]);
    const result = preflight({
      agentId: input.agentId,
      manifest,
      config,
      orgKnowledgeCount: orgKnowledgeRes.count ?? 0,
      agentKnowledgeCount: agentKnowledgeRes.count ?? 0,
    });
    if (!result.ok) {
      return {
        ok: false,
        error: "This agent isn't ready to run. Fill in the items below.",
        preflightMissing: result.missing,
      };
    }
  }

  // Service-role write — bypass RLS so the row's requested_by is correct.
  const admin = createSupabaseServiceRoleClient();
  const { data: req, error } = await admin
    .from("agent_run_requests")
    .insert({
      org_id: agent.org_id,
      agent_id: input.agentId,
      requested_by: user.id,
      input_payload: input.payload ?? {},
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !req) {
    return { ok: false, error: error?.message ?? "Couldn't queue the run." };
  }

  revalidatePath(`/console/agents/${input.agentId}`);
  return { ok: true, requestId: req.id as string };
}

/**
 * Read-only preflight check used by the agent header to decide whether to
 * enable the Run button on page load. Doesn't touch agent_run_requests.
 */
export type PreflightCheck =
  | { ok: true }
  | { ok: false; missing: MissingItem[] }
  | { ok: false; reason: "no-manifest" | "not-found" | "unauthed" };

export async function checkAgentPreflight(
  agentId: string,
): Promise<PreflightCheck> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthed" };

  const { data: agent } = await supabase
    .from("agents")
    .select("id, org_id, config")
    .eq("id", agentId)
    .maybeSingle();
  if (!agent) return { ok: false, reason: "not-found" };

  const config = (agent.config ?? {}) as Record<string, unknown>;
  const agentType = typeof config.type === "string" ? (config.type as string) : null;
  const manifest = getManifest(agentType);
  if (!manifest) return { ok: false, reason: "no-manifest" };

  const [orgKnowledgeRes, agentKnowledgeRes] = await Promise.all([
    supabase
      .from("knowledge_docs")
      .select("id", { count: "exact", head: true })
      .eq("org_id", agent.org_id)
      .eq("scope", "org"),
    supabase
      .from("knowledge_docs")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("scope", "agent"),
  ]);

  const result = preflight({
    agentId,
    manifest,
    config,
    orgKnowledgeCount: orgKnowledgeRes.count ?? 0,
    agentKnowledgeCount: agentKnowledgeRes.count ?? 0,
  });
  if (result.ok) return { ok: true };
  return { ok: false, missing: result.missing };
}
