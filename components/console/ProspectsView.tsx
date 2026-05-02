"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveProspect,
  editProspectDraft,
  passProspect,
} from "@/app/console/prospects/actions";
import type { ProspectRow, ProspectStatus } from "@/lib/db/prospects";

const STATUS_TABS: { key: ProspectStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafted", label: "Drafted" },
  { key: "qualified", label: "Qualified" },
  { key: "scored", label: "Scored" },
  { key: "discovered", label: "New" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
  { key: "passed", label: "Passed" },
];

export default function ProspectsView({
  prospects,
  statusFilter,
}: {
  prospects: ProspectRow[];
  statusFilter: ProspectStatus | "all";
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(prospects[0]?.id ?? null);

  const open = prospects.find((p) => p.id === openId) ?? null;

  function gotoStatus(status: ProspectStatus | "all") {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    router.push(`/console/prospects${params.toString() ? "?" + params.toString() : ""}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="mb-2">
        <h1 className="text-xl font-semibold tracking-tight">Prospects</h1>
        <p className="mt-1 text-sm text-white/55 max-w-2xl">
          Surfaced by lead-generation agents (Signal Hunter, Golf Lead Finder, etc.).
          Every drafted outreach waits here for human approval before send.
        </p>
      </div>

      <div className="mt-6 flex gap-1 border-b border-white/8 pb-px overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => gotoStatus(t.key)}
            className={`px-3 py-2 text-sm border-b-2 transition -mb-px whitespace-nowrap ${
              statusFilter === t.key
                ? "border-fern-500 text-white"
                : "border-transparent text-white/55 hover:text-white"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] text-white/35">
              {prospects.filter((p) => t.key === "all" || p.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {prospects.length === 0 ? (
        <div className="mt-8 text-sm text-white/55 py-12 text-center border border-dashed border-white/10 rounded-lg">
          No prospects yet. Once Signal Hunter or Golf Lead Finder runs, surfaced
          leads land here.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
          <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-1">
            {prospects.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                active={openId === p.id}
                onClick={() => setOpenId(p.id)}
              />
            ))}
          </div>
          <div>
            {open ? (
              <ProspectDetail prospect={open} />
            ) : (
              <div className="border border-dashed border-white/10 rounded-lg p-12 text-center text-sm text-white/45">
                Select a prospect on the left.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProspectCard({
  prospect: p,
  active,
  onClick,
}: {
  prospect: ProspectRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-4 py-3 transition ${
        active
          ? "bg-white/[0.04] border-white/20"
          : "bg-white/[0.01] border-white/8 hover:border-white/15"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {p.full_name}
          </div>
          <div className="mt-0.5 text-[11px] text-white/45">
            {[p.age_band, p.location].filter(Boolean).join(" · ")}
          </div>
        </div>
        {p.icp_score !== null && (
          <ScoreBadge score={p.icp_score} />
        )}
      </div>
      <div className="mt-2 text-xs text-white/65 line-clamp-2">
        {p.signal_summary}
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <StatusPill status={p.status} />
        {p.agent_name && (
          <span className="text-[10px] font-mono text-white/40">
            {p.agent_name}
          </span>
        )}
      </div>
    </button>
  );
}

function ProspectDetail({ prospect: p }: { prospect: ProspectRow }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [subject, setSubject] = useState(p.draft_subject ?? "");
  const [body, setBody] = useState(p.draft_body ?? "");

  function onApprove() {
    if (!p.draft_message_id) return;
    setErr(null);
    startTransition(async () => {
      const r = await approveProspect(p.id, p.draft_message_id!);
      if (!r.ok) setErr(r.error);
    });
  }
  function onPass() {
    if (!confirm(`Pass on ${p.full_name}? Won't be re-contacted.`)) return;
    setErr(null);
    startTransition(async () => {
      const r = await passProspect(p.id);
      if (!r.ok) setErr(r.error);
    });
  }
  function onSaveEdit() {
    if (!p.draft_message_id) return;
    setErr(null);
    startTransition(async () => {
      const r = await editProspectDraft(p.draft_message_id!, subject, body);
      if (!r.ok) setErr(r.error);
      else setEditMode(false);
    });
  }

  return (
    <div className="border border-white/8 rounded-lg bg-[#0E1A14] p-6 space-y-5">
      <div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">{p.full_name}</h2>
            <div className="mt-1 text-xs text-white/55">
              {[p.age_band ? `${p.age_band} yr` : null, p.location, p.signal_type]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {p.icp_score !== null && <ScoreBadge score={p.icp_score} />}
            <StatusPill status={p.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Signal">
          <div className="text-white/85">{p.signal_summary}</div>
          {p.source_url && (
            <a
              href={p.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-[11px] text-fern-300 hover:text-white truncate"
            >
              {p.source_url}
            </a>
          )}
          {p.source_name && (
            <div className="mt-0.5 text-[10px] font-mono text-white/35">
              {p.source_name}
            </div>
          )}
        </Field>
        <Field label="ICP fit">
          <div className="text-white/75 text-sm">
            {p.icp_reasoning ?? "(not yet scored)"}
          </div>
        </Field>
        <Field label="Contact">
          {p.contact_email ? (
            <div>
              <div className="text-white/85">{p.contact_name}</div>
              <div className="text-white/55">{p.contact_email}</div>
              {p.contact_confidence !== null && (
                <div className="mt-0.5 text-[10px] font-mono text-white/45">
                  Confidence {p.contact_confidence}%
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/45 italic">No contact resolved yet.</div>
          )}
        </Field>
        <Field label="Agent">
          <div className="text-white/85">{p.agent_name ?? "—"}</div>
        </Field>
      </div>

      {p.draft_message_id ? (
        <div className="border-t border-white/8 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-white/40">
              Drafted outreach
            </h3>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="text-xs text-white/55 hover:text-white"
              >
                Edit
              </button>
            )}
          </div>
          {editMode ? (
            <div className="space-y-3">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
                placeholder="Subject"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none font-mono"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={onSaveEdit}
                  disabled={pending}
                  className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition"
                >
                  {pending ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={() => {
                    setSubject(p.draft_subject ?? "");
                    setBody(p.draft_body ?? "");
                    setEditMode(false);
                  }}
                  className="text-xs text-white/55 hover:text-white px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-white">
                {p.draft_subject || "(no subject)"}
              </div>
              <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                {p.draft_body || "(no body)"}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-white/8 pt-5 text-sm text-white/55 italic">
          No outreach drafted yet for this prospect.
        </div>
      )}

      <div className="border-t border-white/8 pt-5 flex items-center gap-3">
        <button
          onClick={onApprove}
          disabled={pending || !p.draft_message_id || p.status === "sent"}
          className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-md transition"
        >
          {p.status === "sent" ? "Sent" : pending ? "Approving…" : "Approve & send"}
        </button>
        <button
          onClick={onPass}
          disabled={pending}
          className="text-sm text-white/65 hover:text-white px-3 py-2 rounded-md hover:bg-white/5 transition"
        >
          Pass
        </button>
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 8
      ? "bg-fern-700/15 border-fern-700/30 text-fern-300"
      : score >= 6
      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
      : "bg-white/5 border-white/10 text-white/55";
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wider border px-2 py-0.5 rounded ${tone}`}
    >
      {score}/10
    </span>
  );
}

function StatusPill({ status }: { status: ProspectStatus }) {
  const tone: Record<ProspectStatus, string> = {
    discovered: "bg-white/5 text-white/55 border-white/10",
    scored: "bg-white/5 text-white/55 border-white/10",
    qualified: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    enriched: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    drafted: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    sent: "bg-fern-700/15 text-fern-300 border-fern-700/30",
    replied: "bg-fern-700/20 text-fern-300 border-fern-700/40",
    converted: "bg-fern-500/20 text-fern-200 border-fern-500/40",
    passed: "bg-white/[0.03] text-white/35 border-white/8",
    unreachable: "bg-red-500/10 text-red-300 border-red-500/30",
    unsubscribed: "bg-red-500/15 text-red-300 border-red-500/40",
  };
  return (
    <span
      className={`text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.5 rounded ${tone[status]}`}
    >
      {status}
    </span>
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
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-1.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
