/**
 * Loader + helpers for the org-level "Business profile" settings page.
 * Returns the same KnowledgeDoc rows that the per-agent Knowledge tab shows
 * under "Business profile (read-only here, edit in Settings)".
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { KnowledgeDoc, Org, OrgMember } from "@/lib/supabase/types";

export type BusinessSettingsData = {
  org: Pick<Org, "id" | "slug" | "name" | "setup_status">;
  user: { id: string; display_name: string };
  members: Array<Pick<OrgMember, "id" | "user_id" | "role" | "display_name" | "created_at">>;
  org_knowledge: KnowledgeDoc[];
};

export type BusinessSettingsResult =
  | { ok: true; data: BusinessSettingsData }
  | { ok: false; reason: "not-configured" | "unauthed" | "no-org" };

export async function getBusinessSettings(): Promise<BusinessSettingsResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not-configured" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthed" };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return { ok: false, reason: "no-org" };

  const orgId = membership.org_id as string;

  const [orgRes, allMembersRes, docsRes] = await Promise.all([
    supabase
      .from("orgs")
      .select("id, slug, name, setup_status")
      .eq("id", orgId)
      .single(),
    supabase
      .from("org_members")
      .select("id, user_id, role, display_name, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("knowledge_docs")
      .select("*")
      .eq("org_id", orgId)
      .eq("scope", "org")
      .order("position", { ascending: true }),
  ]);

  const orgRow = orgRes.data as Pick<Org, "id" | "slug" | "name" | "setup_status"> | null;
  if (!orgRow) return { ok: false, reason: "no-org" };

  return {
    ok: true,
    data: {
      org: orgRow,
      user: {
        id: user.id,
        display_name:
          membership.display_name ??
          (user.user_metadata?.display_name as string | undefined) ??
          user.email?.split("@")[0] ??
          "there",
      },
      members: (allMembersRes.data ?? []) as BusinessSettingsData["members"],
      org_knowledge: (docsRes.data ?? []) as KnowledgeDoc[],
    },
  };
}
