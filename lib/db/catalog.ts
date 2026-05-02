/**
 * Catalog data loader. Reads the global agent_types catalog plus, per
 * org, which keys are already installed (so we can mark them).
 *
 * Read-only on the client side: businesses can browse but not install —
 * adding an agent requires contacting Fern.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AgentType, Org } from "@/lib/supabase/types";

export type CatalogEntry = AgentType & {
  installed: boolean;
};

export type CatalogData = {
  org: Pick<Org, "id" | "slug" | "name"> | null;
  user: { id: string; display_name: string };
  entries: CatalogEntry[];
};

export async function getCatalog(): Promise<CatalogData> {
  if (!isSupabaseConfigured()) {
    return { org: null, user: { id: "", display_name: "demo" }, entries: [] };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { org: null, user: { id: "", display_name: "demo" }, entries: [] };
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = (membership?.org_id as string | undefined) ?? null;
  let org: CatalogData["org"] = null;
  const installedKeys = new Set<string>();

  if (orgId) {
    const { data: orgRow } = await supabase
      .from("orgs")
      .select("id, slug, name")
      .eq("id", orgId)
      .maybeSingle();
    org = orgRow ?? null;

    const { data: agents } = await supabase
      .from("agents")
      .select("config, status")
      .eq("org_id", orgId)
      .neq("status", "archived");
    for (const a of agents ?? []) {
      const cfg = (a.config ?? {}) as Record<string, unknown>;
      if (typeof cfg.type === "string") installedKeys.add(cfg.type);
    }
  }

  const { data: types } = await supabase
    .from("agent_types")
    .select("*")
    .eq("is_published", true)
    .order("position", { ascending: true });

  const entries: CatalogEntry[] = ((types ?? []) as AgentType[]).map((t) => ({
    ...t,
    installed: installedKeys.has(t.key),
  }));

  return {
    org,
    user: {
      id: user.id,
      display_name:
        (membership?.display_name as string | null) ?? user.email ?? "you",
    },
    entries,
  };
}
