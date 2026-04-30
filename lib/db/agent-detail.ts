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
      "id, org_id, name, description, status, config, position, created_at, updated_at"
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
