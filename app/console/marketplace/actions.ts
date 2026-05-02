"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InstallResult =
  | { ok: true; agentId: string }
  | { ok: false; error: string };

/**
 * Install an agent type into the current user's org.
 *
 * Creates a row in `agents` with config.type = type.key (so the Hetzner
 * runtime can resolve its agent_id) and copies the type's default_config
 * into the agent's config.
 */
export async function installAgent(typeKey: string): Promise<InstallResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: false, error: "No org membership." };
  const orgId = membership.org_id as string;

  // Look up the type
  const { data: type } = await supabase
    .from("agent_types")
    .select("*")
    .eq("key", typeKey)
    .maybeSingle();
  if (!type) return { ok: false, error: `Unknown agent type: ${typeKey}` };

  // Idempotent: if this org already has an agent of this type, return it.
  const { data: existingAgents } = await supabase
    .from("agents")
    .select("id, status, config")
    .eq("org_id", orgId);
  const already = (existingAgents ?? []).find(
    (a) =>
      typeof (a.config as Record<string, unknown>)?.type === "string" &&
      (a.config as Record<string, unknown>).type === typeKey
  );
  if (already) {
    // If it's archived, un-archive it.
    if (already.status === "archived") {
      await supabase
        .from("agents")
        .update({ status: "scoped" })
        .eq("id", already.id);
    }
    revalidatePath("/console");
    revalidatePath("/console/marketplace");
    return { ok: true, agentId: already.id as string };
  }

  // Pick a position at the end of the existing list
  const maxPosition = (existingAgents ?? []).reduce(
    (m, a) => Math.max(m, (a as { position?: number }).position ?? 0),
    -1
  );

  const config = { type: typeKey, ...(type.default_config ?? {}) };
  const { data: created, error } = await supabase
    .from("agents")
    .insert({
      org_id: orgId,
      name: type.name,
      description: type.description,
      status: "scoped",
      config,
      position: maxPosition + 1,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/console");
  revalidatePath("/console/marketplace");
  return { ok: true, agentId: created.id as string };
}

export type UninstallResult = { ok: true } | { ok: false; error: string };

/**
 * "Uninstall" by archiving the agent — keeps history intact, hides from active
 * lists, can be re-installed (un-archived) later.
 */
export async function uninstallAgent(agentId: string): Promise<UninstallResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("agents")
    .update({ status: "archived" })
    .eq("id", agentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console");
  revalidatePath("/console/marketplace");
  return { ok: true };
}
