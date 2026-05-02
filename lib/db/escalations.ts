/**
 * Loader for /console/escalations — list of items bumped to a human.
 * Joins escalations to messages so the UI can show the offending content.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Escalation, Message, Org, Agent } from "@/lib/supabase/types";

export type EscalationRow = Escalation & {
  message: Pick<Message, "id" | "subject" | "body_preview" | "from_addr" | "direction" | "created_at"> | null;
  agent: Pick<Agent, "id" | "name"> | null;
};

export type EscalationsData = {
  org: Pick<Org, "id" | "slug" | "name" | "setup_status">;
  user: { id: string; display_name: string };
  open: EscalationRow[];
  recently_resolved: EscalationRow[];
};

export type EscalationsResult =
  | { ok: true; data: EscalationsData }
  | { ok: false; reason: "not-configured" | "unauthed" | "no-org" };

export async function getEscalations(): Promise<EscalationsResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not-configured" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthed" };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: false, reason: "no-org" };

  const orgId = membership.org_id as string;

  const [orgRes, openRes, resolvedRes] = await Promise.all([
    supabase
      .from("orgs")
      .select("id, slug, name, setup_status")
      .eq("id", orgId)
      .single(),
    supabase
      .from("escalations")
      .select(
        "*, message:messages(id, subject, body_preview, from_addr, direction, created_at), agent:agents(id, name)"
      )
      .eq("org_id", orgId)
      .in("status", ["open", "claimed"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("escalations")
      .select(
        "*, message:messages(id, subject, body_preview, from_addr, direction, created_at), agent:agents(id, name)"
      )
      .eq("org_id", orgId)
      .in("status", ["resolved", "dismissed"])
      .order("resolved_at", { ascending: false })
      .limit(20),
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
      open: (openRes.data ?? []) as EscalationRow[],
      recently_resolved: (resolvedRes.data ?? []) as EscalationRow[],
    },
  };
}
