"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createStudent } from "@/app/console/students/actions";
import type { Student } from "@/lib/supabase/types";

export default function StudentsList({
  students,
  initialQuery,
}: {
  students: Student[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [showAdd, setShowAdd] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/console/students${params}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-white/55">
            Search players. Click any name to open their profile, view past
            reports, and generate a fresh tournament report from the latest
            public data.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-sm bg-fern-700 hover:bg-fern-600 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          {showAdd ? "Cancel" : "+ Add student"}
        </button>
      </div>

      {showAdd && (
        <AddStudentForm
          onCreated={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}

      <form onSubmit={onSubmit} className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/30 focus:border-fern-700 outline-none"
        />
      </form>

      {students.length === 0 ? (
        <div className="text-sm text-white/55 py-12 text-center border border-dashed border-white/10 rounded-lg">
          {initialQuery
            ? `No students match “${initialQuery}”.`
            : "No students yet. Add one to get started."}
        </div>
      ) : (
        <div className="border border-white/8 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-wider text-white/45">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Age</th>
                <th className="text-left px-4 py-2.5 font-medium">Sport</th>
                <th className="text-left px-4 py-2.5 font-medium">Rating</th>
                <th className="text-left px-4 py-2.5 font-medium">Location</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-t border-white/8 hover:bg-white/[0.02] transition ${
                    i === students.length - 1 ? "" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/console/students/${s.id}`}
                      className="plain text-white hover:text-fern-300"
                    >
                      {s.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/65">{s.age ?? "—"}</td>
                  <td className="px-4 py-3 text-white/65">{s.sport ?? "—"}</td>
                  <td className="px-4 py-3 text-white/65">
                    {s.current_rating !== null ? (
                      <span>
                        {s.current_rating}{" "}
                        <span className="text-white/35 text-xs">
                          {s.current_rating_label ?? ""}
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/65">{s.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Student["status"] }) {
  const styles: Record<Student["status"], string> = {
    prospect: "bg-white/5 text-white/65 border-white/10",
    evaluating: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    active: "bg-fern-700/15 text-fern-300 border-fern-700/30",
    alumni: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    inactive: "bg-white/[0.03] text-white/35 border-white/8",
  };
  return (
    <span
      className={`text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.5 rounded ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function AddStudentForm({ onCreated }: { onCreated: () => void }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("tennis");
  const [location, setLocation] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  function submit() {
    setErr(null);
    startTransition(async () => {
      const r = await createStudent({
        full_name: name,
        age: age.trim() ? Number(age) : null,
        location: location || null,
        sport: sport || null,
        parent_name: parentName || null,
        parent_email: parentEmail || null,
      });
      if (!r.ok) setErr(r.error);
      else onCreated();
    });
  }

  return (
    <div className="border border-white/10 rounded-lg p-5 mb-6 bg-white/[0.02]">
      <h3 className="text-sm font-semibold mb-3">Add student</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            autoFocus
          />
        </Field>
        <Field label="Age">
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="number"
            className="input"
          />
        </Field>
        <Field label="Sport">
          <input
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Location">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, ST"
            className="input"
          />
        </Field>
        <Field label="Parent name">
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Parent email">
          <input
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            type="email"
            className="input"
          />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || !name.trim()}
          className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: white;
          outline: none;
        }
        :global(.input:focus) {
          border-color: rgb(45 90 61);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] text-white/55 mb-1">{label}</div>
      {children}
    </label>
  );
}
