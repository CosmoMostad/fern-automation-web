"use client";

import { useState, useTransition } from "react";

import {
  createStudent,
  generateTournamentReport,
} from "@/app/console/students/actions";
import type { AgentDetailData, Student } from "@/lib/supabase/types";

/**
 * Students tab — for tournament_reports agents.
 *
 * Native (no embedding the standalone /console/students page). Two-pane
 * layout: searchable list on the left, detail + report viewer on the right.
 * "Generate report" kicks off a placeholder; the Hetzner agent run
 * overwrites it with the real synthesis.
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
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
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
        Add a student to generate a report. Or once your roster lands here
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
  const [generated, setGenerated] = useState(false);

  function generate() {
    setError(null);
    setGenerated(false);
    startTransition(async () => {
      const r = await generateTournamentReport(s.id);
      if (!r.ok) setError(r.error);
      else setGenerated(true);
    });
  }

  return (
    <div className="border border-white/10 rounded-xl bg-[#0E1A14] p-6 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
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
            disabled={pending}
            className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-md transition"
          >
            {pending ? "Generating…" : "Generate tournament report"}
          </button>
          {generated && (
            <span className="text-xs text-fern-300">
              Report queued. Check Timeline.
            </span>
          )}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </header>

      {(s.parent_name || s.parent_email) && (
        <div className="border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-white/85 mb-2">
            Parent / guardian
          </div>
          <div className="text-sm text-white">
            {s.parent_name && <span>{s.parent_name}</span>}
            {s.parent_name && s.parent_email && (
              <span className="text-white/55"> · </span>
            )}
            {s.parent_email && (
              <span className="text-white/85">{s.parent_email}</span>
            )}
          </div>
        </div>
      )}

      {Object.keys(s.metadata ?? {}).length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-white/85 mb-2">
            Notes
          </div>
          <dl className="text-sm space-y-1">
            {Object.entries(s.metadata).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-white/65 capitalize">
                  {k.replace(/_/g, " ")}:
                </dt>
                <dd className="text-white/85">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="border-t border-white/10 pt-4">
        <p className="text-sm text-white/65">
          Generated reports show up here once the agent runs. The Timeline
          tab shows every report this agent has produced for any player.
        </p>
      </div>
    </div>
  );
}

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
