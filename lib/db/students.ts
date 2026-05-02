/**
 * Students data loader.
 *
 * Lists students for the current user's org and returns student detail
 * with attached generated reports (newest first).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Org, Student, StudentReport } from "@/lib/supabase/types";

export type StudentsListData = {
  org: Pick<Org, "id" | "slug" | "name"> | null;
  user: { id: string; display_name: string };
  students: Student[];
  query: string;
};

export async function getStudentsList(opts: {
  query?: string;
}): Promise<StudentsListData> {
  if (!isSupabaseConfigured()) {
    return {
      org: null,
      user: { id: "", display_name: "demo" },
      students: [],
      query: opts.query ?? "",
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
      students: [],
      query: opts.query ?? "",
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
  let org: StudentsListData["org"] = null;
  let students: Student[] = [];
  if (orgId) {
    const { data: orgRow } = await supabase
      .from("orgs")
      .select("id, slug, name")
      .eq("id", orgId)
      .maybeSingle();
    org = orgRow ?? null;

    let q = supabase
      .from("students")
      .select("*")
      .eq("org_id", orgId)
      .order("full_name", { ascending: true })
      .limit(100);

    if (opts.query?.trim()) {
      const term = opts.query.trim();
      q = q.ilike("full_name", `%${term}%`);
    }

    const { data: rows } = await q;
    students = (rows as Student[]) ?? [];
  }

  return {
    org,
    user: {
      id: user.id,
      display_name:
        (membership?.display_name as string | null) ?? user.email ?? "you",
    },
    students,
    query: opts.query ?? "",
  };
}

export type StudentDetailData = {
  org: Pick<Org, "id" | "slug" | "name"> | null;
  user: { id: string; display_name: string };
  student: Student | null;
  reports: StudentReport[];
};

export async function getStudentDetail(
  studentId: string
): Promise<StudentDetailData> {
  if (!isSupabaseConfigured()) {
    return {
      org: null,
      user: { id: "", display_name: "demo" },
      student: null,
      reports: [],
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
      student: null,
      reports: [],
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
  let org: StudentDetailData["org"] = null;
  let student: Student | null = null;
  let reports: StudentReport[] = [];

  if (orgId) {
    const { data: orgRow } = await supabase
      .from("orgs")
      .select("id, slug, name")
      .eq("id", orgId)
      .maybeSingle();
    org = orgRow ?? null;

    const { data: stRow } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .eq("org_id", orgId)
      .maybeSingle();
    student = (stRow as Student | null) ?? null;

    const { data: rRows } = await supabase
      .from("student_reports")
      .select("*")
      .eq("student_id", studentId)
      .order("generated_at", { ascending: false })
      .limit(50);
    reports = (rRows as StudentReport[]) ?? [];
  }

  return {
    org,
    user: {
      id: user.id,
      display_name:
        (membership?.display_name as string | null) ?? user.email ?? "you",
    },
    student,
    reports,
  };
}
