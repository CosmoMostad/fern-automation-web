/**
 * Per-agent detail page data loader.
 *
 * RLS guarantees the signed-in user can only see rows from orgs they belong to.
 * If the agent_id isn't visible to them, every query returns empty — we treat
 * that as "not found" upstream.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  AgentDetailData,
  Agent,
  Message,
  Thread,
  Escalation,
  KnowledgeDoc,
  KnowledgeExample,
  KnowledgeDocVersion,
  Org,
  Student,
} from "@/lib/supabase/types";

export type AgentDetailResult =
  | { ok: true; data: AgentDetailData }
  | { ok: false; reason: "not-configured" | "unauthed" | "not-found" };

export async function getAgentDetail(
  agentId: string
): Promise<AgentDetailResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "not-configured" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthed" };

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, org_id, name, description, status, config, trust_mode, position, created_at, updated_at"
    )
    .eq("id", agentId)
    .maybeSingle();

  if (!agent) return { ok: false, reason: "not-found" };

  const orgId = (agent as Agent).org_id;

  const [
    orgRes,
    membershipRes,
    messagesRes,
    threadsRes,
    escalationsRes,
    orgKnowledgeRes,
    agentKnowledgeRes,
    examplesRes,
  ] = await Promise.all([
    supabase
      .from("orgs")
      .select("id, slug, name, setup_status")
      .eq("id", orgId)
      .single(),
    supabase
      .from("org_members")
      .select("display_name, role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("threads")
      .select("*")
      .eq("agent_id", agentId)
      .order("last_message_at", { ascending: false })
      .limit(20),
    supabase
      .from("escalations")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("knowledge_docs")
      .select("*")
      .eq("org_id", orgId)
      .eq("scope", "org")
      .order("position", { ascending: true }),
    supabase
      .from("knowledge_docs")
      .select("*")
      .eq("agent_id", agentId)
      .eq("scope", "agent")
      .order("position", { ascending: true }),
    supabase
      .from("knowledge_examples")
      .select("*")
      .eq("agent_id", agentId)
      .order("position", { ascending: true }),
  ]);

  const orgRow = orgRes.data as Pick<Org, "id" | "slug" | "name" | "setup_status"> | null;
  if (!orgRow) return { ok: false, reason: "not-found" };

  const displayName =
    membershipRes.data?.display_name ??
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  // Agent-type-specific extras: pull data the per-agent tabs need so the
  // page renders without an extra round-trip when a tab opens.
  const agentType =
    typeof (agent.config as Record<string, unknown>)?.type === "string"
      ? ((agent.config as Record<string, unknown>).type as string)
      : null;

  let students: Student[] | undefined;
  let prospects: AgentDetailData["prospects"] | undefined;

  if (agentType === "tournament_reports") {
    const { data: studentRows } = await supabase
      .from("students")
      .select("*")
      .eq("org_id", orgId)
      .order("full_name", { ascending: true })
      .limit(200);
    students = (studentRows as Student[] | null) ?? [];
  }

  if (agentType === "golf_lead_finder" || agentType === "signal_hunter") {
    const { data: prospectRows } = await supabase
      .from("prospects")
      .select("*")
      .eq("org_id", orgId)
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(100);
    const baseRows = (prospectRows ?? []) as Array<Record<string, unknown>>;

    // Attach the latest drafted message per prospect (for the inline draft preview)
    const prospectIds = baseRows.map((r) => r.id as string);
    const draftByProspect = new Map<
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
      const linkPid = new Map<string, string>();
      const messageIds: string[] = [];
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
        status: r.status as string,
        created_at: r.created_at as string,
        agent_name: (agent as Agent).name,
        agent_type: agentType,
        draft_message_id: draft?.messageId ?? null,
        draft_subject: draft?.subject ?? null,
        draft_body: draft?.body ?? null,
      };
    });
  }

  return {
    ok: true,
    data: {
      org: orgRow,
      user: { id: user.id, display_name: displayName },
      agent: agent as Agent,
      recent_messages: (messagesRes.data ?? []) as Message[],
      recent_threads: (threadsRes.data ?? []) as Thread[],
      open_escalations: (escalationsRes.data ?? []) as Escalation[],
      org_knowledge: (orgKnowledgeRes.data ?? []) as KnowledgeDoc[],
      agent_knowledge: (agentKnowledgeRes.data ?? []) as KnowledgeDoc[],
      examples: (examplesRes.data ?? []) as KnowledgeExample[],
      students,
      prospects,
    },
  };
}

export async function getKnowledgeDocVersions(
  docId: string
): Promise<KnowledgeDocVersion[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("knowledge_doc_versions")
    .select("*")
    .eq("doc_id", docId)
    .order("edited_at", { ascending: false })
    .limit(50);
  return (data ?? []) as KnowledgeDocVersion[];
}
