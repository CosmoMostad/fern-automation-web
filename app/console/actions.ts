"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { revalidatePath } from "next/cache";

export type RequestAgentInput = {
  orgId: string | null;
  kind: string;
  tools: string;
  urgency: "no-rush" | "this-month" | "this-week";
};

export type RequestAgentResult =
  | { ok: true; mode: "inserted" | "demo" }
  | { ok: false; error: string };

/**
 * Submits a "Request a new agent" form.
 * - If Supabase is configured and the user is authed, insert into agent_requests.
 * - If not (demo mode), pretend to succeed so the prototype still works.
 */
export async function submitAgentRequest(
  input: RequestAgentInput
): Promise<RequestAgentResult> {
  if (!input.kind?.trim()) {
    return { ok: false, error: "Tell me what kind of agent you need." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true, mode: "demo" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to request an agent." };
  }

  const { error } = await supabase.from("agent_requests").insert({
    org_id: input.orgId,
    user_id: user.id,
    kind: input.kind.trim(),
    tools: input.tools?.trim() || null,
    urgency: input.urgency,
    status: "new",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/console");
  return { ok: true, mode: "inserted" };
}
