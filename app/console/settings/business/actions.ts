"use server";

import { revalidatePath } from "next/cache";

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Result = { ok: true } | { ok: false; error: string };

async function authed() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function createOrgKnowledgeDoc(input: {
  orgId: string;
  title: string;
  body: string;
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };

  const { error } = await ctx.supabase.from("knowledge_docs").insert({
    org_id: input.orgId,
    agent_id: null,
    scope: "org",
    title: input.title.trim(),
    body: input.body,
    created_by: ctx.user.id,
    updated_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/settings/business");
  revalidatePath("/console");
  return { ok: true };
}

export async function updateOrgKnowledgeDoc(input: {
  docId: string;
  title: string;
  body: string;
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
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

  revalidatePath("/console/settings/business");
  return { ok: true };
}

export async function deleteOrgKnowledgeDoc(input: {
  docId: string;
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const { error } = await ctx.supabase
    .from("knowledge_docs")
    .delete()
    .eq("id", input.docId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/settings/business");
  return { ok: true };
}

export async function updateOrgName(input: {
  orgId: string;
  name: string;
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  if (!input.name.trim()) return { ok: false, error: "Name is required." };

  const { error } = await ctx.supabase
    .from("orgs")
    .update({ name: input.name.trim() })
    .eq("id", input.orgId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console");
  revalidatePath("/console/settings/business");
  return { ok: true };
}

/* ───────────── TEAM INVITES ───────────── */

const VALID_ROLES = new Set(["owner", "admin", "staff", "viewer"]);

export async function inviteTeamMember(input: {
  orgId: string;
  email: string;
  role?: "owner" | "admin" | "staff" | "viewer";
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }
  const role = input.role && VALID_ROLES.has(input.role) ? input.role : "staff";

  // Authorization: read-check the org via RLS first. If the user can read it,
  // they belong to it. (Per-role checks — only owners/admins can invite — can
  // come later; for now any member can invite.)
  const { data: org } = await ctx.supabase
    .from("orgs")
    .select("id")
    .eq("id", input.orgId)
    .maybeSingle();
  if (!org) return { ok: false, error: "Org not found or no access." };

  const admin = createSupabaseServiceRoleClient();

  // Upsert the invite row first so even if the email send fails (rate limit,
  // domain not verified, etc.), the auto-attach on first sign-in still works.
  const { error: inviteErr } = await admin
    .from("org_invites")
    .upsert(
      {
        org_id: input.orgId,
        email,
        role,
        invited_by: ctx.user.id,
        accepted_at: null,
        accepted_by: null,
      },
      { onConflict: "org_id,email" }
    );
  if (inviteErr) return { ok: false, error: inviteErr.message };

  // Send the invite email via Supabase auth (Resend SMTP delivers it).
  // If the user already exists in auth.users, this returns an error we ignore —
  // they'll just sign in normally with their existing email and the auto-attach
  // kicks in.
  const { error: mailErr } = await admin.auth.admin.inviteUserByEmail(email);
  if (mailErr && !/already (registered|been registered|exists)/i.test(mailErr.message)) {
    // Soft-fail: the invite row exists; surface the mail issue to the inviter
    // so they can retry or hand-off the link.
    return {
      ok: false,
      error: `Invite saved, but email failed to send: ${mailErr.message}`,
    };
  }

  revalidatePath("/console/settings/business");
  return { ok: true };
}

export async function cancelTeamInvite(input: {
  inviteId: string;
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };

  // Read-gate via RLS; if the SELECT returns a row, we can act on it.
  const { data: invite } = await ctx.supabase
    .from("org_invites")
    .select("id")
    .eq("id", input.inviteId)
    .maybeSingle();
  if (!invite) return { ok: false, error: "Invite not found or no access." };

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("org_invites")
    .delete()
    .eq("id", input.inviteId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/settings/business");
  return { ok: true };
}

export async function removeTeamMember(input: {
  memberId: string;
}): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };

  // Read-gate via RLS
  const { data: m } = await ctx.supabase
    .from("org_members")
    .select("id, user_id")
    .eq("id", input.memberId)
    .maybeSingle();
  if (!m) return { ok: false, error: "Member not found." };
  if (m.user_id === ctx.user.id) {
    return { ok: false, error: "You can't remove yourself." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("org_members")
    .delete()
    .eq("id", input.memberId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/settings/business");
  return { ok: true };
}

/**
 * Called from the dashboard loader on first sign-in: if the signed-in user
 * has no membership but there's a pending invite for their email, attach
 * them to that org and mark the invite accepted. This is the auto-onboarding
 * step that makes the team-invite flow seamless.
 */
export async function claimPendingInvitesForCurrentUser(): Promise<{
  attached: number;
}> {
  const ctx = await authed();
  if (!ctx) return { attached: 0 };

  const email = ctx.user.email?.toLowerCase();
  if (!email) return { attached: 0 };

  const admin = createSupabaseServiceRoleClient();
  const { data: invites } = await admin
    .from("org_invites")
    .select("*")
    .eq("email", email)
    .is("accepted_at", null);

  if (!invites || invites.length === 0) return { attached: 0 };

  let attached = 0;
  for (const inv of invites) {
    // Insert membership (idempotent via unique (org_id, user_id))
    const { error: memErr } = await admin
      .from("org_members")
      .upsert(
        {
          org_id: inv.org_id,
          user_id: ctx.user.id,
          role: inv.role,
          display_name: ctx.user.user_metadata?.display_name ?? null,
        },
        { onConflict: "org_id,user_id" }
      );
    if (memErr) continue;

    await admin
      .from("org_invites")
      .update({ accepted_at: new Date().toISOString(), accepted_by: ctx.user.id })
      .eq("id", inv.id);
    attached++;
  }

  if (attached > 0) {
    revalidatePath("/console");
    revalidatePath("/console/settings/business");
  }
  return { attached };
}
