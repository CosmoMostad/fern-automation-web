"use server";

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateStudentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createStudent(input: {
  full_name: string;
  age: number | null;
  location: string | null;
  sport: string | null;
  parent_email: string | null;
  parent_name: string | null;
}): Promise<CreateStudentResult> {
  if (!input.full_name?.trim()) {
    return { ok: false, error: "Name required." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: false, error: "No org membership." };

  const { data, error } = await supabase
    .from("students")
    .insert({
      org_id: membership.org_id,
      full_name: input.full_name.trim(),
      age: input.age,
      location: input.location?.trim() || null,
      sport: input.sport?.trim() || null,
      parent_email: input.parent_email?.trim() || null,
      parent_name: input.parent_name?.trim() || null,
      status: "prospect",
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/console/students");
  return { ok: true, id: data.id as string };
}

export type GenerateReportResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

/**
 * Trigger the tournament_reports agent for a student. Inserts an
 * agent_run_requests row and returns the request id so the UI can poll
 * for completion. The Hetzner run_requests daemon picks it up within
 * ~15 seconds, runs the agent, and writes a student_reports row plus
 * marks the request 'done'.
 */
export async function generateTournamentReport(
  studentId: string
): Promise<GenerateReportResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: false, error: "No org membership." };
  const orgId = membership.org_id as string;

  // Verify the student belongs to this org (RLS would block anyway, but a
  // clear early error is friendlier than a confusing one later).
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("id", studentId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!student) return { ok: false, error: "Student not found." };

  // Find the tournament_reports agent for this org. Without one, there's
  // nothing to dispatch to.
  const { data: agents } = await supabase
    .from("agents")
    .select("id, config")
    .eq("org_id", orgId);
  const reportAgent = (agents ?? []).find(
    (a) =>
      typeof (a.config as Record<string, unknown>)?.type === "string" &&
      (a.config as Record<string, unknown>).type === "tournament_reports"
  );
  if (!reportAgent) {
    return {
      ok: false,
      error: "Tournament Reports agent isn't installed for this org.",
    };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: req, error } = await admin
    .from("agent_run_requests")
    .insert({
      org_id: orgId,
      agent_id: reportAgent.id,
      requested_by: user.id,
      input_payload: { student_id: studentId },
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !req) {
    return { ok: false, error: error?.message ?? "Couldn't queue the report." };
  }

  revalidatePath(`/console/students/${studentId}`);
  return { ok: true, requestId: req.id as string };
}
