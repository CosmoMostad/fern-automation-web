/**
 * Marketplace data loader.
 *
 * Returns the global agent_types catalog joined with per-org install state
 * (which types this org has installed and their status). Drives the
 * /console/marketplace browse view.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  AgentStatus,
  AgentType,
  MarketplaceAgentType,
  Org,
} from "@/lib/supabase/types";

export type MarketplaceData = {
  org: Pick<Org, "id" | "slug" | "name"> | null;
  user: { id: string; display_name: string };
  types: MarketplaceAgentType[];
};

export async function getMarketplaceData(): Promise<MarketplaceData> {
  if (!isSupabaseConfigured()) {
    return { org: null, user: { id: "", display_name: "demo" }, types: [] };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { org: null, user: { id: "", display_name: "demo" }, types: [] };
  }

  // Find the user's first org (multi-org switching is a later concern).
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id ?? null;
  let org: MarketplaceData["org"] = null;
  if (orgId) {
    const { data: orgRow } = await supabase
      .from("orgs")
      .select("id, slug, name")
      .eq("id", orgId)
      .maybeSingle();
    org = orgRow ?? null;
  }

  // 1. Pull the global catalog.
  const { data: types } = await supabase
    .from("agent_types")
    .select("*")
    .eq("is_published", true)
    .order("position", { ascending: true });
  const catalog: AgentType[] = (types as AgentType[]) ?? [];

  // 2. Pull this org's installed agents to compute install state per type.
  let installedByKey = new Map<string, { id: string; status: AgentStatus }>();
  if (orgId) {
    const { data: agents } = await supabase
      .from("agents")
      .select("id, status, config")
      .eq("org_id", orgId);
    for (const a of agents ?? []) {
      const cfg = (a.config ?? {}) as Record<string, unknown>;
      const key = typeof cfg.type === "string" ? cfg.type : null;
      if (key) {
        installedByKey.set(key, {
          id: a.id as string,
          status: a.status as AgentStatus,
        });
      }
    }
  }

  const merged: MarketplaceAgentType[] = catalog.map((t) => {
    const inst = installedByKey.get(t.key);
    return {
      ...t,
      installed_agent_id: inst?.id ?? null,
      installed_status: inst?.status ?? null,
    };
  });

  return {
    org,
    user: {
      id: user.id,
      display_name:
        (membership?.display_name as string | null) ??
        user.email ??
        "you",
    },
    types: merged,
  };
}
