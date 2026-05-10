"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createKnowledgeExample,
  updateKnowledgeExample,
  toggleKnowledgeExample,
  deleteKnowledgeExample,
  requestExampleBuild,
  cancelExampleBuild,
  dismissExampleBuild,
} from "@/app/console/agents/[id]/actions";
import type {
  AgentDetailData,
  ExampleBuildRequest,
  KnowledgeExample,
} from "@/lib/supabase/types";

export default function ExamplesTab({ data }: { data: AgentDetailData }) {
  const gmailConnected = isGmailConnected(
    (data.agent.config ?? {}) as Record<string, unknown>
  );
  const builds = data.example_build_requests ?? [];
  const activeBuilds = builds.filter(
    (b) => b.status === "pending" || b.status === "running"
  ).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <ExampleBuilderPanel
        orgId={data.org.id}
        agentId={data.agent.id}
        gmailConnected={gmailConnected}
        recentBuilds={builds}
      />

      <BuildPoller activeCount={activeBuilds} />

      <div>
        <h3 className="text-sm font-semibold text-white">Few-shot examples</h3>
        <p className="mt-1 text-xs text-white/55 max-w-xl">
          Pairs of (incoming message → ideal reply) the agent reads before drafting. The
          best examples here directly shape the agent&rsquo;s voice. Toggle them off
          anytime without losing the data.
        </p>
      </div>

      {data.examples.length === 0 ? (
        <EmptyHint
          text="No examples yet."
          cta="Build from past Gmail replies above, or paste one manually below."
        />
      ) : (
        <div className="space-y-2">
          {data.examples.map((ex) => (
            <ExampleCard key={ex.id} ex={ex} agentId={data.agent.id} />
          ))}
        </div>
      )}

      <CreateExampleForm orgId={data.org.id} agentId={data.agent.id} />
    </div>
  );
}

/* ───────────── Build-from-Gmail panel ───────────── */

function ExampleBuilderPanel({
  orgId,
  agentId,
  gmailConnected,
  recentBuilds,
}: {
  orgId: string;
  agentId: string;
  gmailConnected: boolean;
  recentBuilds: ExampleBuildRequest[];
}) {
  const [lookbackDays, setLookbackDays] = useState(90);
  const [maxExamples, setMaxExamples] = useState(25);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function build() {
    setError(null);
    startTransition(async () => {
      const r = await requestExampleBuild({
        orgId,
        agentId,
        lookbackDays,
        maxExamples,
      });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="rounded-lg border border-fern-700/25 bg-fern-700/[0.04] p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white">
          Build from past Gmail replies
        </h3>
        <p className="mt-1 text-xs text-white/65 max-w-xl">
          Scan this agent&rsquo;s connected inbox and turn past replies into few-shot
          examples. The agent learns your voice from real messages you&rsquo;ve already
          sent. Re-running skips messages already imported.
        </p>
      </div>

      {!gmailConnected ? (
        <div className="text-xs text-amber-300">
          Connect Gmail on this agent first.{" "}
          <Link
            href={`/console/agents/${agentId}?tab=connections`}
            className="underline hover:text-amber-200"
          >
            Open Connections →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                Lookback
              </div>
              <select
                value={lookbackDays}
                onChange={(e) => setLookbackDays(Number(e.target.value))}
                disabled={pending}
                className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:border-fern-700 outline-none"
              >
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
                <option value={365}>Last 365 days</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                Max new examples
              </div>
              <select
                value={maxExamples}
                onChange={(e) => setMaxExamples(Number(e.target.value))}
                disabled={pending}
                className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:border-fern-700 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <button
              onClick={build}
              disabled={pending}
              className="bg-fern-700 hover:bg-fern-600 text-white text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
            >
              {pending ? "Queueing…" : "Build examples"}
            </button>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </>
      )}

      {recentBuilds.length > 0 && (
        <div className="space-y-2 pt-1">
          {recentBuilds.map((r) => (
            <ExampleBuildRow key={r.id} request={r} agentId={agentId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExampleBuildRow({
  request: r,
  agentId,
}: {
  request: ExampleBuildRequest;
  agentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelExampleBuild({ requestId: r.id, agentId });
      if (!result.ok) setError(result.error);
    });
  }

  function dismiss() {
    setError(null);
    startTransition(async () => {
      const result = await dismissExampleBuild({ requestId: r.id, agentId });
      if (!result.ok) setError(result.error);
    });
  }

  const tone = TONE_BY_STATUS[r.status];
  const isTerminal =
    r.status === "done" || r.status === "failed" || r.status === "cancelled";

  return (
    <div className={`rounded-md border ${tone.border} ${tone.bg} px-3 py-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-medium ${tone.label} ${tone.labelBg} border ${tone.labelBorder} px-1.5 py-0.5 rounded`}
            >
              {STATUS_LABEL[r.status]}
            </span>
            <span className="text-xs text-white/85">
              Last {r.lookback_days}d · up to {r.max_examples} new
            </span>
          </div>
          <div className="text-[11px] text-white/55 mt-1">
            {r.status === "done" && r.result_summary && (
              <>
                Scanned {r.result_summary.scanned ?? 0} sent messages,
                found {r.result_summary.pairs_found ?? 0} reply pairs,
                saved {r.result_summary.saved ?? 0}
                {r.result_summary.skipped_duplicates
                  ? `, skipped ${r.result_summary.skipped_duplicates} already imported`
                  : ""}
              </>
            )}
            {r.status === "failed" && r.error && (
              <span className="text-red-400">{r.error.slice(0, 240)}</span>
            )}
            {(r.status === "pending" || r.status === "running") && (
              <>Queued {timeAgo(r.created_at)}</>
            )}
          </div>
        </div>
        {r.status === "pending" && (
          <button
            disabled={pending}
            onClick={cancel}
            className="text-xs text-white/65 hover:text-white shrink-0 disabled:opacity-50"
          >
            {pending ? "…" : "Cancel"}
          </button>
        )}
        {isTerminal && (
          <button
            disabled={pending}
            onClick={dismiss}
            className="text-xs text-white/55 hover:text-white shrink-0 disabled:opacity-50"
            title="Remove this row from the list"
          >
            {pending ? "…" : "Dismiss"}
          </button>
        )}
      </div>
      {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
    </div>
  );
}

function BuildPoller({ activeCount }: { activeCount: number }) {
  const router = useRouter();
  useEffect(() => {
    if (activeCount === 0) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [activeCount, router]);
  return null;
}

/* ───────────── Existing example card + form (unchanged behavior) ───────────── */

function ExampleCard({ ex, agentId }: { ex: KnowledgeExample; agentId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(ex.label);
  const [inbound, setInbound] = useState(ex.inbound ?? "");
  const [outbound, setOutbound] = useState(ex.outbound);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateKnowledgeExample({
        exampleId: ex.id,
        agentId,
        label,
        inbound,
        outbound,
      });
      if (r.ok) {
        setEditing(false);
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  function toggle() {
    startTransition(async () => {
      const r = await toggleKnowledgeExample({
        exampleId: ex.id,
        agentId,
        active: !ex.active,
      });
      if (!r.ok) setError(r.error);
    });
  }

  function destroy() {
    if (!confirm(`Delete example "${ex.label}"?`)) return;
    startTransition(async () => {
      const r = await deleteKnowledgeExample({ exampleId: ex.id, agentId });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div
      className={`rounded-lg border bg-white/[0.025] transition ${
        ex.active ? "border-white/8" : "border-white/5 opacity-60"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{ex.label}</span>
            {ex.source === "gmail_import" && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-fern-300 px-1.5 py-0.5 rounded bg-fern-700/15 border border-fern-700/30">
                from gmail
              </span>
            )}
            {!ex.active && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/45 px-1.5 py-0.5 rounded bg-white/8">
                inactive
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-white/35 mt-0.5 truncate">
            {ex.inbound ? `↓ ${ex.inbound.slice(0, 60)}…` : "(no inbound)"} &nbsp;·&nbsp;
            ↑ {ex.outbound.slice(0, 60)}…
          </div>
        </div>
        <span className={`text-white/35 transition-transform ${open ? "rotate-90" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {editing ? (
            <>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. polite_first_nudge)"
                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
              />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                  Inbound (optional)
                </div>
                <textarea
                  rows={3}
                  value={inbound}
                  onChange={(e) => setInbound(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
                />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                  Outbound (the desired reply)
                </div>
                <textarea
                  rows={5}
                  value={outbound}
                  onChange={(e) => setOutbound(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pending}
                  onClick={save}
                  className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  disabled={pending}
                  onClick={() => {
                    setEditing(false);
                    setLabel(ex.label);
                    setInbound(ex.inbound ?? "");
                    setOutbound(ex.outbound);
                  }}
                  className="text-xs text-white/65 hover:text-white px-3 py-1.5 rounded-md"
                >
                  Cancel
                </button>
                {error && <span className="text-xs text-red-400">{error}</span>}
              </div>
            </>
          ) : (
            <>
              {ex.inbound && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                    Inbound
                  </div>
                  <pre className="text-xs text-white/75 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded p-3">
                    {ex.inbound}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                  Outbound
                </div>
                <pre className="text-xs text-white/85 whitespace-pre-wrap font-sans leading-relaxed bg-fern-700/10 border border-fern-700/20 rounded p-3">
                  {ex.outbound}
                </pre>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md transition"
                >
                  Edit
                </button>
                <button
                  onClick={toggle}
                  disabled={pending}
                  className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                >
                  {ex.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={destroy}
                  disabled={pending}
                  className="text-xs text-red-400/85 hover:text-red-300 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                >
                  Delete
                </button>
                {error && <span className="text-xs text-red-400">{error}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateExampleForm({ orgId, agentId }: { orgId: string; agentId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [inbound, setInbound] = useState("");
  const [outbound, setOutbound] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createKnowledgeExample({
        orgId,
        agentId,
        label,
        inbound,
        outbound,
      });
      if (r.ok) {
        setLabel("");
        setInbound("");
        setOutbound("");
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-lg border border-dashed border-white/15 hover:border-fern-700/60 bg-white/[0.015] hover:bg-fern-700/[0.04] py-3 px-4 transition"
      >
        <span className="text-sm text-white/65 hover:text-white">+ Add example manually</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 space-y-3">
      <input
        autoFocus
        placeholder="Label (e.g. tier1_member_courtesy)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
      />
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
          Inbound (optional)
        </div>
        <textarea
          rows={3}
          placeholder="The kind of message this example responds to. Leave blank for output-only patterns."
          value={inbound}
          onChange={(e) => setInbound(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
        />
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
          Outbound (the desired reply)
        </div>
        <textarea
          rows={5}
          placeholder="The exact tone, structure, and content you want the agent to imitate."
          value={outbound}
          onChange={(e) => setOutbound(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          onClick={submit}
          className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          Add example
        </button>
        <button
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setLabel("");
            setInbound("");
            setOutbound("");
            setError(null);
          }}
          className="text-xs text-white/65 hover:text-white px-3 py-1.5 rounded-md"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

function EmptyHint({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.015] px-4 py-6 text-center">
      <div className="text-sm text-white/65">{text}</div>
      <div className="mt-1 text-xs text-white/45">{cta}</div>
    </div>
  );
}

/* ───────────── Helpers ───────────── */

function isGmailConnected(config: Record<string, unknown>): boolean {
  const gmail = (config?.gmail as Record<string, unknown> | undefined) ?? {};
  return (
    typeof gmail.account === "string" &&
    gmail.account.length > 0 &&
    typeof gmail.refresh_token_encrypted === "string" &&
    (gmail.refresh_token_encrypted as string).length > 0
  );
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

const STATUS_LABEL: Record<ExampleBuildRequest["status"], string> = {
  pending: "Queued",
  running: "Building…",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const TONE_BY_STATUS: Record<
  ExampleBuildRequest["status"],
  {
    border: string;
    bg: string;
    label: string;
    labelBg: string;
    labelBorder: string;
  }
> = {
  pending: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.05]",
    label: "text-amber-300",
    labelBg: "bg-amber-500/15",
    labelBorder: "border-amber-500/30",
  },
  running: {
    border: "border-fern-500/30",
    bg: "bg-fern-700/[0.06]",
    label: "text-fern-300",
    labelBg: "bg-fern-700/15",
    labelBorder: "border-fern-700/30",
  },
  done: {
    border: "border-white/10",
    bg: "bg-white/[0.02]",
    label: "text-fern-300",
    labelBg: "bg-fern-700/15",
    labelBorder: "border-fern-700/30",
  },
  failed: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.05]",
    label: "text-red-300",
    labelBg: "bg-red-500/15",
    labelBorder: "border-red-500/30",
  },
  cancelled: {
    border: "border-white/10",
    bg: "bg-white/[0.015]",
    label: "text-white/55",
    labelBg: "bg-white/5",
    labelBorder: "border-white/10",
  },
};
