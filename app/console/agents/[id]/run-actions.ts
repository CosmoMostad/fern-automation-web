"use server";

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EnqueueResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

/**
 * Generic "Run now" trigger. Any agent type wired into the Hetzner
 * dispatch table (run_requests.py) can be triggered through this action.
 * The UI calls it from the Workspace tab's "Run agent now" buttons.
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
