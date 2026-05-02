/**
 * Prospects data loader.
 *
 * Pulls prospect rows for the current user's org, joined with the agent
 * row (so we can label which agent surfaced this prospect — Signal Hunter,
 * Golf Lead Finder, etc.) and the latest related message (the drafted
 * outreach for review).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Org } from "@/lib/supabase/types";

export type ProspectStatus =
  | "discovered"
  | "scored"
  | "qualified"
  | "enriched"
  | "drafted"
  | "sent"
  | "replied"
  | "converted"
  | "passed"
  | "unreachable"
  | "unsubscribed";

export type ProspectRow = {
  id: string;
  org_id: string;
  agent_id: string | null;
  full_name: string;
  age: number | null;
  age_band: string | null;
  location: string | null;
  signal_type: string;
  signal_summary: string;
  signal_detail: Record<string, unknown>;
  source_name: string;
  source_url: string | null;
  icp_score: number | null;
  icp_reasoning: string | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_relation: string | null;
  contact_confidence: number | null;
  status: ProspectStatus;
  created_at: string;

  // joined fields
  agent_name: string | null;
  agent_type: string | null;
  draft_subject: string | null;
  draft_body: string | null;
  draft_message_id: string | null;
};

export type ProspectsListData = {
  org: Pick<Org, "id" | "slug" | "name"> | null;
  user: { id: string; display_name: string };
  prospects: ProspectRow[];
  agentFilter: string | null;
  statusFilter: ProspectStatus | "all";
};

export async function getProspectsList(opts: {
  agentFilter: string | null;
  statusFilter: ProspectStatus | "all";
}): Promise<ProspectsListData> {
  if (!isSupabaseConfigured()) {
    return {
      org: null,
      user: { id: "", display_name: "demo" },
      prospects: [],
      agentFilter: opts.agentFilter,
      statusFilter: opts.statusFilter,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      org: null,
      user: { id: "", display_name: "demo" },
      prospects: [],
      agentFilter: opts.agentFilter,
      statusFilter: opts.statusFilter,
    };
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = (membership?.org_id as string | undefined) ?? null;
  let org: ProspectsListData["org"] = null;
  let prospects: ProspectRow[] = [];

  if (orgId) {
    const { data: orgRow } = await supabase
      .from("orgs")
      .select("id, slug, name")
      .eq("id", orgId)
      .maybeSingle();
    org = orgRow ?? null;

    let q = supabase
      .from("prospects")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (opts.agentFilter) q = q.eq("agent_id", opts.agentFilter);
    if (opts.statusFilter !== "all") q = q.eq("status", opts.statusFilter);

    const { data: rows } = await q;
    const baseRows = (rows ?? []) as Array<Record<string, unknown>>;

    // Pull related agents in one query
    const agentIds = Array.from(
      new Set(
        baseRows
          .map((r) => r.agent_id as string | null)
          .filter((x): x is string => !!x)
      )
    );
    let agentByIdName = new Map<string, { name: string; type: string | null }>();
    if (agentIds.length > 0) {
      const { data: agents } = await supabase
        .from("agents")
        .select("id, name, config")
        .in("id", agentIds);
      for (const a of agents ?? []) {
        const cfg = (a.config ?? {}) as Record<string, unknown>;
        agentByIdName.set(a.id as string, {
          name: a.name as string,
          type: typeof cfg.type === "string" ? cfg.type : null,
        });
      }
    }

    // Pull most recent drafted message per prospect (via prospect_outreach)
    const prospectIds = baseRows.map((r) => r.id as string);
    let draftByProspect = new Map<
      string,
      { messageId: string; subject: string | null; body: string | null }
    >();
    if (prospectIds.length > 0) {
      const { data: outreaches } = await supabase
        .from("prospect_outreach")
        .select("prospect_id, message_id, created_at")
        .in("prospect_id", prospectIds)
        .not("message_id", "is", null)
        .order("created_at", { ascending: false });
      const seen = new Set<string>();
      const messageIds: string[] = [];
      const linkPid = new Map<string, string>();
      for (const o of outreaches ?? []) {
        const pid = o.prospect_id as string;
        const mid = o.message_id as string | null;
        if (!mid || seen.has(pid)) continue;
        seen.add(pid);
        messageIds.push(mid);
        linkPid.set(mid, pid);
      }
      if (messageIds.length > 0) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, subject, body")
          .in("id", messageIds);
        for (const m of msgs ?? []) {
          const pid = linkPid.get(m.id as string);
          if (pid) {
            draftByProspect.set(pid, {
              messageId: m.id as string,
              subject: (m.subject as string | null) ?? null,
              body: (m.body as string | null) ?? null,
            });
          }
        }
      }
    }

    prospects = baseRows.map((r) => {
      const agentInfo = r.agent_id
        ? agentByIdName.get(r.agent_id as string)
        : undefined;
      const draft = draftByProspect.get(r.id as string);
      return {
        id: r.id as string,
        org_id: r.org_id as string,
        agent_id: (r.agent_id as string | null) ?? null,
        full_name: r.full_name as string,
        age: (r.age as number | null) ?? null,
        age_band: (r.age_band as string | null) ?? null,
        location: (r.location as string | null) ?? null,
        signal_type: r.signal_type as string,
        signal_summary: r.signal_summary as string,
        signal_detail: (r.signal_detail as Record<string, unknown>) ?? {},
        source_name: r.source_name as string,
        source_url: (r.source_url as string | null) ?? null,
        icp_score: (r.icp_score as number | null) ?? null,
        icp_reasoning: (r.icp_reasoning as string | null) ?? null,
        contact_email: (r.contact_email as string | null) ?? null,
        contact_name: (r.contact_name as string | null) ?? null,
        contact_relation: (r.contact_relation as string | null) ?? null,
        contact_confidence: (r.contact_confidence as number | null) ?? null,
        status: r.status as ProspectStatus,
        created_at: r.created_at as string,
        agent_name: agentInfo?.name ?? null,
        agent_type: agentInfo?.type ?? null,
        draft_message_id: draft?.messageId ?? null,
        draft_subject: draft?.subject ?? null,
        draft_body: draft?.body ?? null,
      };
    });
  }

  return {
    org,
    user: {
      id: user.id,
      display_name:
        (membership?.display_name as string | null) ?? user.email ?? "you",
    },
    prospects,
    agentFilter: opts.agentFilter,
    statusFilter: opts.statusFilter,
  };
}
