/**
 * Loader for /console/inbox — cross-agent message view, all of the org's
 * recent inbound and outbound traffic in one stream.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Agent, Message, Org } from "@/lib/supabase/types";

export type InboxData = {
  org: Pick<Org, "id" | "slug" | "name" | "setup_status">;
  user: { id: string; display_name: string };
  agents: Pick<Agent, "id" | "name" | "status">[];
  messages: Message[];
};

export type InboxResult =
  | { ok: true; data: InboxData }
  | { ok: false; reason: "not-configured" | "unauthed" | "no-org" };

export async function getInbox(): Promise<InboxResult> {
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

  const [orgRes, agentsRes, msgsRes] = await Promise.all([
    supabase
      .from("orgs")
      .select("id, slug, name, setup_status")
      .eq("id", orgId)
      .single(),
    supabase
      .from("agents")
      .select("id, name, status")
      .eq("org_id", orgId)
      .order("position", { ascending: true }),
    supabase
      .from("messages")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100),
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
      agents: (agentsRes.data ?? []) as Pick<Agent, "id" | "name" | "status">[],
      messages: (msgsRes.data ?? []) as Message[],
    },
  };
}
