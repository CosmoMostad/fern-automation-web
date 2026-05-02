/**
 * Loader + helpers for the org-level "Business profile" settings page.
 * Returns the same KnowledgeDoc rows that the per-agent Knowledge tab shows
 * under "Business profile (read-only here, edit in Settings)".
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  KnowledgeDoc,
  Org,
  OrgInvite,
  OrgMember,
} from "@/lib/supabase/types";

export type MemberRow = Pick<
  OrgMember,
  "id" | "user_id" | "role" | "display_name" | "created_at"
> & {
  email: string | null;
};

export type BusinessSettingsData = {
  org: Pick<Org, "id" | "slug" | "name" | "setup_status">;
  user: { id: string; display_name: string; role: string };
  members: MemberRow[];
  pending_invites: OrgInvite[];
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

  const [orgRes, allMembersRes, docsRes, invitesRes] = await Promise.all([
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
    supabase
      .from("org_invites")
      .select("*")
      .eq("org_id", orgId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const orgRow = orgRes.data as Pick<Org, "id" | "slug" | "name" | "setup_status"> | null;
  if (!orgRow) return { ok: false, reason: "no-org" };

  // Resolve emails for each member via auth.admin (service-role only) so the
  // team list shows real email addresses instead of opaque user_ids.
  const memberRows = (allMembersRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    role: OrgMember["role"];
    display_name: string | null;
    created_at: string;
  }>;
  const emailByUser = new Map<string, string | null>();
  try {
    const { createSupabaseServiceRoleClient } = await import(
      "@/lib/supabase/server"
    );
    const admin = createSupabaseServiceRoleClient();
    // listUsers is paginated; one page (200) covers any realistic team size.
    const { data: usersList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    for (const u of usersList?.users ?? []) {
      emailByUser.set(u.id, u.email ?? null);
    }
  } catch {
    // Service-role lookup not available — return null emails (UI shows display_name only).
  }

  const members: MemberRow[] = memberRows.map((m) => ({
    ...m,
    email: emailByUser.get(m.user_id) ?? null,
  }));

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
        role: (membership.role as string) ?? "staff",
      },
      members,
      pending_invites: (invitesRes.data ?? []) as OrgInvite[],
      org_knowledge: (docsRes.data ?? []) as KnowledgeDoc[],
    },
  };
}
