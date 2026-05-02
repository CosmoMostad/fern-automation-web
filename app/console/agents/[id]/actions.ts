"use server";

import { revalidatePath } from "next/cache";

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ActionResult = { ok: true } | { ok: false; error: string };

type AuthCtx =
  | { kind: "ok"; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; user: { id: string } }
  | { kind: "err"; error: string };

async function withAuth(): Promise<AuthCtx> {
  if (!isSupabaseConfigured()) {
    return { kind: "err", error: "Supabase isn't connected." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "err", error: "Not signed in." };
  return { kind: "ok", supabase, user };
}

/* ───────────── KNOWLEDGE DOCS ───────────── */

export async function createKnowledgeDoc(input: {
  agentId: string;
  scope: "org" | "agent";
  title: string;
  body: string;
  orgId: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  if (!input.title.trim()) return { ok: false, error: "Title is required." };

  const { error } = await ctx.supabase.from("knowledge_docs").insert({
    org_id: input.orgId,
    agent_id: input.scope === "agent" ? input.agentId : null,
    scope: input.scope,
    title: input.title.trim(),
    body: input.body,
    created_by: ctx.user.id,
    updated_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console/settings/business`);
  return { ok: true };
}

export async function updateKnowledgeDoc(input: {
  docId: string;
  title: string;
  body: string;
  agentId?: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  if (!input.title.trim()) return { ok: false, error: "Title is required." };

  const { error } = await ctx.supabase
    .from("knowledge_docs")
    .update({
      title: input.title.trim(),
      body: input.body,
      updated_by: ctx.user.id,
    })
    .eq("id", input.docId);
  if (error) return { ok: false, error: error.message };

  if (input.agentId) revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console/settings/business`);
  return { ok: true };
}

export async function deleteKnowledgeDoc(input: {
  docId: string;
  agentId?: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("knowledge_docs")
    .delete()
    .eq("id", input.docId);
  if (error) return { ok: false, error: error.message };

  if (input.agentId) revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console/settings/business`);
  return { ok: true };
}

/* ───────────── KNOWLEDGE EXAMPLES ───────────── */

export async function createKnowledgeExample(input: {
  orgId: string;
  agentId: string;
  label: string;
  inbound: string;
  outbound: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  if (!input.label.trim()) return { ok: false, error: "Label is required." };
  if (!input.outbound.trim()) return { ok: false, error: "Outbound text is required." };

  const { error } = await ctx.supabase.from("knowledge_examples").insert({
    org_id: input.orgId,
    agent_id: input.agentId,
    label: input.label.trim(),
    inbound: input.inbound.trim() || null,
    outbound: input.outbound,
    active: true,
    created_by: ctx.user.id,
    updated_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  return { ok: true };
}

export async function updateKnowledgeExample(input: {
  exampleId: string;
  agentId: string;
  label: string;
  inbound: string;
  outbound: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  if (!input.label.trim()) return { ok: false, error: "Label is required." };
  if (!input.outbound.trim()) return { ok: false, error: "Outbound text is required." };

  const { error } = await ctx.supabase
    .from("knowledge_examples")
    .update({
      label: input.label.trim(),
      inbound: input.inbound.trim() || null,
      outbound: input.outbound,
      updated_by: ctx.user.id,
    })
    .eq("id", input.exampleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  return { ok: true };
}

export async function toggleKnowledgeExample(input: {
  exampleId: string;
  agentId: string;
  active: boolean;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("knowledge_examples")
    .update({ active: input.active, updated_by: ctx.user.id })
    .eq("id", input.exampleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  return { ok: true };
}

export async function deleteKnowledgeExample(input: {
  exampleId: string;
  agentId: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("knowledge_examples")
    .delete()
    .eq("id", input.exampleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  return { ok: true };
}

/* ───────────── AGENT SETTINGS (rename + status) ───────────── */

export async function updateAgentSettings(input: {
  agentId: string;
  name?: string;
  description?: string;
  status?: "scoped" | "in-build" | "live" | "paused" | "archived";
  trust_mode?: "manual" | "assisted" | "autonomous";
  approval_required?: boolean;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) return { ok: false, error: "Name is required." };
    patch.name = input.name.trim();
  }
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.trust_mode !== undefined) patch.trust_mode = input.trust_mode;

  // approval_required lives inside the JSONB config — merge it into the existing
  // config so we don't blow away other keys.
  if (input.approval_required !== undefined) {
    const { data: agent } = await ctx.supabase
      .from("agents")
      .select("config")
      .eq("id", input.agentId)
      .maybeSingle();
    const existingConfig = (agent?.config ?? {}) as Record<string, unknown>;
    patch.config = { ...existingConfig, approval_required: input.approval_required };
  }

  const { error } = await ctx.supabase
    .from("agents")
    .update(patch)
    .eq("id", input.agentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console`);
  return { ok: true };
}

/* ───────────── AGENT CONFIG (deep-path edit) ───────────── */

export async function updateAgentConfig(input: {
  agentId: string;
  /** Dotted path inside agent.config — e.g. "gmail.account" */
  path: string;
  value: unknown;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  if (!input.path.trim()) return { ok: false, error: "Path is required." };

  const { data: agent } = await ctx.supabase
    .from("agents")
    .select("config")
    .eq("id", input.agentId)
    .maybeSingle();
  if (!agent) return { ok: false, error: "Agent not found." };

  const next = setPath(
    JSON.parse(JSON.stringify(agent.config ?? {})) as Record<string, unknown>,
    input.path,
    input.value
  );

  const { error } = await ctx.supabase
    .from("agents")
    .update({ config: next })
    .eq("id", input.agentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console`);
  return { ok: true };
}

function setPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const existing = cur[k];
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      cur = existing as Record<string, unknown>;
    } else {
      const fresh: Record<string, unknown> = {};
      cur[k] = fresh;
      cur = fresh;
    }
  }
  // Empty values clear the leaf so re-saving doesn't keep stale state.
  if (
    value === "" ||
    value === null ||
    (Array.isArray(value) && value.length === 0)
  ) {
    delete cur[parts[parts.length - 1]];
  } else {
    cur[parts[parts.length - 1]] = value;
  }
  return obj;
}

/* ───────────── MESSAGE APPROVALS ───────────── */

export async function approveMessage(input: {
  messageId: string;
  agentId: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  // Authorization gate: RLS on `messages` only allows the user to SEE this row
  // if they belong to the org. So a successful read confirms membership.
  const { data: msg } = await ctx.supabase
    .from("messages")
    .select("id, status")
    .eq("id", input.messageId)
    .maybeSingle();
  if (!msg) return { ok: false, error: "Message not found." };
  if (msg.status !== "pending_approval") {
    return { ok: false, error: "Already handled." };
  }

  // Bypass RLS for the actual update — Hetzner cron-poll picks up
  // status='approved' rows and ships them via Gmail.
  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("messages")
    .update({
      status: "approved",
      approved_by: ctx.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", input.messageId)
    .eq("status", "pending_approval");
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console/inbox`);
  return { ok: true };
}

export async function escalateMessage(input: {
  messageId: string;
  agentId: string;
  reason: "low_confidence" | "manual_flag" | "requested_human" | "angry_tone" | "policy_block" | "other";
  detail?: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  // Resolve org_id from the message itself — RLS guarantees we can only
  // see this message if we're a member of its org, so this lookup is the
  // authorization check.
  const { data: msg } = await ctx.supabase
    .from("messages")
    .select("id, org_id, agent_id")
    .eq("id", input.messageId)
    .maybeSingle();
  if (!msg) return { ok: false, error: "Message not found." };

  // Flip the message's status (RLS update was disabled for messages, but the
  // service-role client does this; the user's authorization is established by
  // the read above).
  const admin = createSupabaseServiceRoleClient();
  const { error: msgErr } = await admin
    .from("messages")
    .update({ status: "escalated" })
    .eq("id", input.messageId);
  if (msgErr) return { ok: false, error: msgErr.message };

  const { error: escErr } = await admin.from("escalations").insert({
    org_id: msg.org_id,
    agent_id: msg.agent_id ?? input.agentId,
    message_id: input.messageId,
    reason: input.reason,
    reason_detail: input.detail ?? null,
  });
  if (escErr) return { ok: false, error: escErr.message };

  revalidatePath(`/console/agents/${input.agentId}`);
  revalidatePath(`/console/escalations`);
  return { ok: true };
}

/* ───────────── ESCALATION CLAIM / RESOLVE ───────────── */

export async function claimEscalation(input: { escalationId: string }): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("escalations")
    .update({
      status: "claimed",
      claimed_by: ctx.user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", input.escalationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/escalations`);
  return { ok: true };
}

export async function resolveEscalation(input: {
  escalationId: string;
  note?: string;
}): Promise<ActionResult> {
  const ctx = await withAuth();
  if (ctx.kind === "err") return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("escalations")
    .update({
      status: "resolved",
      resolved_by: ctx.user.id,
      resolved_at: new Date().toISOString(),
      resolution_note: input.note ?? null,
    })
    .eq("id", input.escalationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/console/escalations`);
  return { ok: true };
}
