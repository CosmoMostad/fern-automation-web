"use client";

import { useMemo, useState, useTransition } from "react";

import {
  approveProspect,
  editProspectDraft,
  passProspect,
} from "@/app/console/prospects/actions";
import { enqueueAgentRun } from "@/app/console/agents/[id]/run-actions";
import { useAgentRunStatus } from "@/lib/use-agent-run-status";
import type { AgentDetailData } from "@/lib/supabase/types";

type Status =
  | "discovered"
  | "scored"
  | "qualified"
  | "enriched"
  | "drafted"
  | "sent"
  | "replied"
  | "converted"
  | "passed"
  | "unreachable"
  | "unsubscribed";

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafted", label: "Drafted" },
  { key: "qualified", label: "Qualified" },
  { key: "scored", label: "Scored" },
  { key: "discovered", label: "New" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
  { key: "passed", label: "Passed" },
];

export default function ProspectsTab({ data }: { data: AgentDetailData }) {
  const all = (data.prospects ?? []) as NonNullable<AgentDetailData["prospects"]>;
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<string | null>(all[0]?.id ?? null);
  const [runReqId, setRunReqId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runPending, startRunTransition] = useTransition();

  const filtered = useMemo(
    () =>
      all.filter((p) =>
        statusFilter === "all" ? true : p.status === statusFilter
      ),
    [all, statusFilter]
  );
  const open = filtered.find((p) => p.id === openId) ?? filtered[0] ?? null;

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    c.set("all", all.length);
    for (const p of all) c.set(p.status, (c.get(p.status) ?? 0) + 1);
    return c;
  }, [all]);

  const { status: runStatus, request: runRequest, elapsedMs } = useAgentRunStatus(runReqId, {
    onDone: () => {
      // Trigger a refresh so the new prospects show up. Server data is reloaded
      // by Next.js when `revalidatePath` was called inside the agent action.
      if (typeof window !== "undefined") window.location.reload();
    },
  });
  const isRunning = runStatus === "pending" || runStatus === "running";

  function runNow() {
    setRunError(null);
    startRunTransition(async () => {
      const r = await enqueueAgentRun({ agentId: data.agent.id });
      if (!r.ok) setRunError(r.error);
      else setRunReqId(r.requestId);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white">Prospects</h2>
          <p className="mt-1 text-sm text-white/75">
            Leads this agent has surfaced. Every drafted email waits here for
            your review — approve to send, edit to refine, pass to skip.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={runNow}
            disabled={runPending || isRunning}
            className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition"
          >
            {runPending
              ? "Queueing…"
              : isRunning
              ? `${runStatus === "pending" ? "Queued" : "Running"}… ${formatElapsed(elapsedMs)}`
              : "Run agent now"}
          </button>
          {runStatus === "failed" && runRequest?.error && (
            <span className="text-xs text-red-400 max-w-xs text-right">
              Run failed: {runRequest.error.split("\n")[0]}
            </span>
          )}
          {runError && (
            <span className="text-xs text-red-400">{runError}</span>
          )}
        </div>
      </header>

      <div className="flex gap-1 border-b border-white/10 pb-px overflow-x-auto">
        {STATUS_TABS.map((t) => {
          const n = counts.get(t.key) ?? 0;
          const active = statusFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setOpenId(null);
              }}
              className={`px-3 py-2 text-sm border-b-2 transition -mb-px whitespace-nowrap ${
                active
                  ? "border-fern-500 text-white"
                  : "border-transparent text-white/65 hover:text-white"
              }`}
            >
              {t.label}
              <span
                className={`ml-2 text-xs ${
                  active ? "text-white/85" : "text-white/45"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <div className="space-y-2 max-h-[78vh] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                active={open?.id === p.id}
                onClick={() => setOpenId(p.id)}
              />
            ))}
          </div>
          {open ? (
            <ProspectDetail prospect={open} />
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-sm text-white/60">
              Select a prospect on the left.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ statusFilter }: { statusFilter: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-12 px-6 text-center">
      <div className="text-base font-semibold text-white">
        No prospects {statusFilter !== "all" ? `in this status` : "yet"}.
      </div>
      <p className="mt-2 text-sm text-white/75 max-w-md mx-auto">
        Once this agent runs and surfaces leads, they&rsquo;ll show up here
        with the signal that triggered them, the source URL for verification,
        and a drafted outreach email ready for your one-click approval.
      </p>
    </div>
  );
}

function ProspectCard({
  prospect: p,
  active,
  onClick,
}: {
  prospect: NonNullable<AgentDetailData["prospects"]>[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-4 py-3 transition ${
        active
          ? "bg-white/[0.06] border-white/25"
          : "bg-white/[0.02] border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {p.full_name}
          </div>
          <div className="mt-0.5 text-xs text-white/65">
            {[p.age_band ? `age ${p.age_band}` : null, p.location]
              .filter(Boolean)
              .join(" · ") || "—"}
          </div>
        </div>
        {p.icp_score !== null && <ScoreBadge score={p.icp_score} />}
      </div>
      <div className="mt-2 text-sm text-white/85 line-clamp-2 leading-snug">
        {p.signal_summary}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <StatusPill status={p.status} />
        {p.source_name && (
          <span className="text-xs text-white/55 truncate">
            {p.source_name}
          </span>
        )}
      </div>
    </button>
  );
}

function ProspectDetail({
  prospect: p,
}: {
  prospect: NonNullable<AgentDetailData["prospects"]>[number];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [subject, setSubject] = useState(p.draft_subject ?? "");
  const [body, setBody] = useState(p.draft_body ?? "");

  function approve() {
    if (!p.draft_message_id) return;
    setError(null);
    startTransition(async () => {
      const r = await approveProspect(p.id, p.draft_message_id!);
      if (!r.ok) setError(r.error);
    });
  }
  function pass() {
    if (!confirm(`Pass on ${p.full_name}? They won't be re-contacted.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await passProspect(p.id);
      if (!r.ok) setError(r.error);
    });
  }
  function saveEdit() {
    if (!p.draft_message_id) return;
    setError(null);
    startTransition(async () => {
      const r = await editProspectDraft(p.draft_message_id!, subject, body);
      if (!r.ok) setError(r.error);
      else setEditMode(false);
    });
  }

  return (
    <div className="border border-white/10 rounded-xl bg-[#0E1A14] p-6 space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-white">{p.full_name}</h3>
          <div className="mt-1 text-sm text-white/75">
            {[p.age_band ? `age ${p.age_band}` : null, p.location]
              .filter(Boolean)
              .join(" · ") || "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {p.icp_score !== null && <ScoreBadge score={p.icp_score} />}
          <StatusPill status={p.status} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Signal">
          <p className="text-sm text-white">{p.signal_summary}</p>
          {p.source_url && (
            <a
              href={p.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-xs text-fern-300 hover:text-white truncate"
            >
              {p.source_url} ↗
            </a>
          )}
          {p.source_name && (
            <div className="mt-1 text-xs text-white/65">{p.source_name}</div>
          )}
        </Field>
        <Field label="ICP fit">
          <p className="text-sm text-white/85 leading-relaxed">
            {p.icp_reasoning ?? "(not yet scored)"}
          </p>
        </Field>
        <Field label="Contact">
          {p.contact_email ? (
            <div className="space-y-0.5">
              <div className="text-sm text-white">
                {p.contact_name ?? "(unnamed)"}
              </div>
              <div className="text-sm text-white/75">{p.contact_email}</div>
              {p.contact_confidence !== null && (
                <div className="text-xs text-white/65">
                  Match confidence: {p.contact_confidence}%
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/55 italic">
              No contact resolved yet.
            </p>
          )}
        </Field>
        <Field label="Discovered">
          <p className="text-sm text-white/85">{timeAgo(p.created_at)}</p>
        </Field>
      </div>

      {p.draft_message_id ? (
        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">
              Drafted outreach
            </h4>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="text-xs text-white/75 hover:text-white"
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
                className="w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:border-fern-500 outline-none"
                placeholder="Subject"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:border-fern-500 outline-none font-sans leading-relaxed"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdit}
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
                  className="text-xs text-white/75 hover:text-white px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-white">
                {p.draft_subject || "(no subject)"}
              </div>
              <pre className="mt-2 text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.03] rounded-md p-4 border border-white/8">
                {p.draft_body || "(no body)"}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-white/10 pt-5 text-sm text-white/65 italic">
          No outreach drafted yet — usually means contact resolution
          didn&rsquo;t find an email for this prospect.
        </div>
      )}

      <div className="border-t border-white/10 pt-5 flex items-center gap-3 flex-wrap">
        <button
          onClick={approve}
          disabled={pending || !p.draft_message_id || p.status === "sent"}
          className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-md transition"
        >
          {p.status === "sent" ? "Sent" : pending ? "Approving…" : "Approve & send"}
        </button>
        <button
          onClick={pass}
          disabled={pending}
          className="text-sm text-white/75 hover:text-white px-3 py-2 rounded-md hover:bg-white/5 transition"
        >
          Pass
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 8
      ? "bg-fern-700/15 border-fern-700/30 text-fern-300"
      : score >= 6
      ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
      : "bg-white/5 border-white/15 text-white/75";
  return (
    <span
      className={`text-xs font-semibold border px-2 py-0.5 rounded ${tone}`}
    >
      {score}/10
    </span>
  );
}

function StatusPill({ status }: { status: Status | string }) {
  const tone: Record<string, string> = {
    discovered: "bg-white/5 text-white/75 border-white/15",
    scored: "bg-white/5 text-white/75 border-white/15",
    qualified: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    enriched: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    drafted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    sent: "bg-fern-700/15 text-fern-300 border-fern-700/30",
    replied: "bg-fern-700/25 text-fern-300 border-fern-700/40",
    converted: "bg-fern-500/25 text-fern-200 border-fern-500/40",
    passed: "bg-white/5 text-white/55 border-white/10",
    unreachable: "bg-red-500/15 text-red-300 border-red-500/30",
    unsubscribed: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return (
    <span
      className={`text-xs font-medium border px-2 py-0.5 rounded whitespace-nowrap ${
        tone[status] ?? "bg-white/5 text-white/75 border-white/15"
      }`}
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
      <div className="text-xs font-semibold text-white/85 mb-2">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s - m * 60}s`;
}
