"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Approve the drafted outreach for a prospect — flips its associated
 * message to status='approved', which the Hetzner cron-poll daemon picks
 * up and ships via Gmail. Also marks the prospect status='sent' (the
 * actual sent flag will flip via send_approved.py).
 */
export async function approveProspect(
  prospectId: string,
  messageId: string
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error: msgErr } = await supabase
    .from("messages")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", messageId);
  if (msgErr) return { ok: false, error: msgErr.message };

  // Optimistic prospect status
  await supabase
    .from("prospects")
    .update({ status: "sent" })
    .eq("id", prospectId);

  revalidatePath("/console/prospects");
  return { ok: true };
}

export async function passProspect(prospectId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("prospects")
    .update({ status: "passed" })
    .eq("id", prospectId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/prospects");
  return { ok: true };
}

export async function editProspectDraft(
  messageId: string,
  subject: string,
  body: string
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("messages")
    .update({ subject, body })
    .eq("id", messageId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/prospects");
  return { ok: true };
}
