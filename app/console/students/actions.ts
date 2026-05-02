"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  | { ok: true; reportId: string }
  | { ok: false; error: string };

/**
 * Stub the report-generation handoff to Hetzner.
 *
 * Real flow: insert a row into agent_requests (or a dedicated trigger
 * table) that the Hetzner runtime polls; once the agent finishes, the
 * student_reports row is written via service-role REST and shows up
 * in the UI.
 *
 * For now: insert a placeholder student_reports row so the UI flow can
 * be tested end-to-end. The real Hetzner agent overwrites this when run.
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

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, age, location")
    .eq("id", studentId)
    .eq("org_id", membership.org_id)
    .maybeSingle();
  if (!student) return { ok: false, error: "Student not found." };

  // Placeholder body — Hetzner agent run will replace this with the
  // real synthesized report (same row, same id).
  const placeholder = `# ${student.full_name} — Tournament Report

*Generated ${new Date().toISOString().slice(0, 10)} — placeholder while the Hetzner agent runs.*

The tournament_reports agent will overwrite this body once it finishes pulling source data and synthesizing the report.

To trigger the real run from your Mac:

\`\`\`
.venv/bin/python -m agents.tournament_reports.agent --client wsc --student-id ${student.id}
\`\`\`
`;

  const { data, error } = await supabase
    .from("student_reports")
    .insert({
      org_id: membership.org_id,
      student_id: studentId,
      student_name_snapshot: student.full_name,
      report_type: "tournament",
      body_markdown: placeholder,
      source_data: {},
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  revalidatePath(`/console/students/${studentId}`);
  return { ok: true, reportId: data.id as string };
}
