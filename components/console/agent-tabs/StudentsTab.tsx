"use client";

import { useEffect, useState, useTransition } from "react";

import {
  createStudent,
  generateTournamentReport,
} from "@/app/console/students/actions";
import { useAgentRunStatus } from "@/lib/use-agent-run-status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AgentDetailData,
  Student,
  StudentReport,
} from "@/lib/supabase/types";
import StudentReportCharts from "@/components/console/StudentReportCharts";
import StudentReportRenderer from "@/components/console/StudentReportRenderer";

/**
 * Students tab — for tournament_reports agents.
 *
 * Native, two-pane: searchable list left, profile + report viewer right.
 * "Generate report" enqueues an agent_run_requests row; the Hetzner
 * dispatcher picks it up, runs the agent, writes a student_reports row,
 * marks the request done. The UI polls the request id and surfaces
 * status: queued → running → ready (or failed).
 */
export default function StudentsTab({ data }: { data: AgentDetailData }) {
  const all = (data.students ?? []) as Student[];
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(all[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = query.trim()
    ? all.filter((s) =>
        s.full_name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : all;
  const open = filtered.find((s) => s.id === openId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Students</h2>
          <p className="mt-1 text-sm text-white/75">
            Search a player. Click to open their profile and generate a fresh
            tournament report from configured public sources.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-sm bg-fern-700 hover:bg-fern-600 text-white font-medium px-3 py-2 rounded-md transition"
        >
          {showAdd ? "Cancel" : "+ Add student"}
        </button>
      </header>

      {showAdd && <AddStudentForm onCreated={() => setShowAdd(false)} />}

      {all.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-fern-500 outline-none mb-3"
            />
            <div className="space-y-1.5 max-h-[78vh] overflow-y-auto pr-1">
              {filtered.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  active={open?.id === s.id}
                  onClick={() => setOpenId(s.id)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-white/55 px-2 py-6 text-center">
                  No matches for &ldquo;{query}&rdquo;.
                </p>
              )}
            </div>
          </div>
          {open ? (
            <StudentDetailPanel student={open} />
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-sm text-white/60">
              Select a student on the left.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-12 px-6 text-center">
      <div className="text-base font-semibold text-white">
        No students yet.
      </div>
      <p className="mt-2 text-sm text-white/75 max-w-md mx-auto">
        Add a student to generate a report. Or once your roster is wired in
        from CourtReserve / your CRM, they appear automatically.
      </p>
    </div>
  );
}

function StudentRow({
  student: s,
  active,
  onClick,
}: {
  student: Student;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border px-3 py-2.5 transition ${
        active
          ? "bg-white/[0.06] border-white/25"
          : "bg-white/[0.02] border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {s.full_name}
          </div>
          <div className="mt-0.5 text-xs text-white/65 truncate">
            {[
              s.age != null ? `${s.age}` : null,
              s.location,
              s.sport,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {s.current_rating !== null && (
          <span className="text-xs font-semibold text-white/85 whitespace-nowrap">
            {s.current_rating}{" "}
            <span className="text-white/55 font-normal">
              {s.current_rating_label}
            </span>
          </span>
        )}
      </div>
    </button>
  );
}

function StudentDetailPanel({ student: s }: { student: Student }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [openReportId, setOpenReportId] = useState<string | null>(null);

  // Initial + post-generation report load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingReports(true);
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("student_reports")
        .select("*")
        .eq("student_id", s.id)
        .order("generated_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const list = (data as StudentReport[]) ?? [];
      setReports(list);
      setOpenReportId((cur) => cur ?? list[0]?.id ?? null);
      setLoadingReports(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [s.id]);

  const { status, request, elapsedMs } = useAgentRunStatus(requestId, {
    onDone: async () => {
      // Re-fetch reports — the agent just wrote a new student_reports row.
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("student_reports")
        .select("*")
        .eq("student_id", s.id)
        .order("generated_at", { ascending: false })
        .limit(20);
      const list = (data as StudentReport[]) ?? [];
      setReports(list);
      if (list.length > 0) setOpenReportId(list[0].id);
    },
  });

  function generate() {
    setError(null);
    startTransition(async () => {
      const r = await generateTournamentReport(s.id);
      if (!r.ok) setError(r.error);
      else setRequestId(r.requestId);
    });
  }

  const isRunning = status === "pending" || status === "running";
  const openReport = reports.find((r) => r.id === openReportId) ?? null;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="border border-white/10 rounded-xl bg-[#0E1A14] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-semibold text-white">{s.full_name}</h3>
            <div className="mt-1 text-sm text-white/75">
              {[
                s.age != null ? `Age ${s.age}` : null,
                s.location,
                s.sport,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
            {s.current_rating !== null && (
              <div className="mt-3 inline-flex items-center gap-2 bg-fern-700/15 border border-fern-700/30 px-3 py-1.5 rounded-md">
                <span className="text-xs font-semibold text-fern-300">
                  {s.current_rating_label ?? "Rating"}
                </span>
                <span className="text-base font-bold text-white">
                  {s.current_rating}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={generate}
              disabled={pending || isRunning}
              className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition"
            >
              {pending
                ? "Queueing…"
                : isRunning
                ? `${status === "pending" ? "Queued" : "Running"}… ${formatElapsed(elapsedMs)}`
                : "Generate tournament report"}
            </button>
            {status === "failed" && request?.error && (
              <span className="text-xs text-red-400 max-w-xs text-right">
                Run failed: {request.error.split("\n")[0]}
              </span>
            )}
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
        </div>

        {(s.parent_name || s.parent_email) && (
          <div className="mt-5 pt-4 border-t border-white/8 text-sm text-white/75">
            <span className="text-white/55 mr-2">Parent / guardian:</span>
            {s.parent_name && <span className="text-white">{s.parent_name}</span>}
            {s.parent_name && s.parent_email && (
              <span className="text-white/45"> · </span>
            )}
            {s.parent_email && (
              <span className="text-white/85">{s.parent_email}</span>
            )}
          </div>
        )}
      </div>

      {/* Reports section */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Reports</h3>
            <span className="text-xs text-white/55">{reports.length}</span>
          </div>
          {loadingReports ? (
            <p className="text-xs text-white/55 px-2 py-3">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="text-sm text-white/65 border border-dashed border-white/15 rounded-md p-3">
              No reports yet. Click <em className="text-white">Generate</em>{" "}
              above.
            </div>
          ) : (
            <div className="space-y-1.5">
              {reports.map((r) => {
                const active = r.id === openReportId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setOpenReportId(r.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${
                      active
                        ? "bg-white/[0.06] border-white/25 text-white"
                        : "bg-white/[0.02] border-white/10 text-white/75 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <div className="capitalize">{r.report_type} report</div>
                    <div className="mt-0.5 text-[11px] text-white/55">
                      {new Date(r.generated_at).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {openReport ? (
            <div className="border border-white/10 rounded-xl bg-[#0E1A14] p-6 space-y-6">
              <StudentReportCharts sourceData={openReport.source_data} />
              <StudentReportRenderer markdown={openReport.body_markdown} />
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-sm text-white/60">
              {reports.length > 0
                ? "Select a report on the left."
                : "Generate a report to see it here."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}m ${r}s`;
}

/* ───────────── Add student form ───────────── */

function AddStudentForm({ onCreated }: { onCreated: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("tennis");
  const [location, setLocation] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createStudent({
        full_name: name,
        age: age.trim() ? Number(age) : null,
        location: location || null,
        sport: sport || null,
        parent_name: parentName || null,
        parent_email: parentEmail || null,
      });
      if (!r.ok) setError(r.error);
      else onCreated();
    });
  }

  return (
    <div className="border border-white/15 rounded-xl p-5 bg-white/[0.02]">
      <h3 className="text-sm font-semibold text-white mb-4">Add student</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Full name *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            autoFocus
          />
        </FormField>
        <FormField label="Age">
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="number"
            className="form-input"
          />
        </FormField>
        <FormField label="Sport">
          <input
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Location">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, ST"
            className="form-input"
          />
        </FormField>
        <FormField label="Parent name">
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Parent email">
          <input
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            type="email"
            className="form-input"
          />
        </FormField>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || !name.trim()}
          className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-md transition"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          color: white;
          outline: none;
        }
        :global(.form-input::placeholder) { color: rgba(255, 255, 255, 0.35); }
        :global(.form-input:focus) { border-color: rgb(123 184 150); }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-white/85 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
