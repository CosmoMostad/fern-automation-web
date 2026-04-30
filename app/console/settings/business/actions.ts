"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
