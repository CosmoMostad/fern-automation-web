"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  enqueueAgentRun,
  checkAgentPreflight,
  type PreflightCheck,
} from "@/app/console/agents/[id]/run-actions";
import { useAgentRunStatus } from "@/lib/use-agent-run-status";
import type { MissingItem } from "@/lib/agents/preflight";

/**
 * Universal Run-Agent control. Sits in the agent detail header; same
 * behavior for every agent type.
 *
 * Three states:
 *   1. Loading preflight — neutral skeleton.
 *   2. Preflight blocked — big "Before this agent can run" panel listing
 *      every missing connection / knowledge doc with a deep link to fix.
 *      Run button disabled.
 *   3. Preflight ok — Run button enabled. Click → enqueue → live status.
 *
 * Status while running comes from useAgentRunStatus, which polls the
 * agent_run_requests row until terminal.
 */
export default function RunAgentButton({
  agentId,
  agentStatus,
  agentTypeLabel,
}: {
  agentId: string;
  agentStatus: string;
  agentTypeLabel?: string;
}) {
  const [preflight, setPreflight] = useState<PreflightCheck | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [enqueueError, setEnqueueError] = useState<string | null>(null);

  const { status, elapsedMs } = useAgentRunStatus(requestId);

  useEffect(() => {
    let cancelled = false;
    checkAgentPreflight(agentId).then((r) => {
      if (!cancelled) setPreflight(r);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  function refreshPreflight() {
    checkAgentPreflight(agentId).then(setPreflight);
  }

  function handleRun() {
    setEnqueueError(null);
    startTransition(async () => {
      const r = await enqueueAgentRun({ agentId });
      if (r.ok) {
        setRequestId(r.requestId);
        return;
      }
      setEnqueueError(r.error);
      if ("preflightMissing" in r) {
        setPreflight({ ok: false, missing: r.preflightMissing });
      }
    });
  }

  // ─── Status flags ─────────────────────────────────────────────────────────
  const blockedByStatus =
    agentStatus === "archived" || agentStatus === "paused";
  const blockedByPreflight =
    preflight !== null && preflight.ok === false && "missing" in preflight;
  const runInFlight =
    requestId !== null &&
    status !== "done" &&
    status !== "failed" &&
    status !== "cancelled";
  const disabled = pending || runInFlight || blockedByStatus || blockedByPreflight;

  const buttonLabel = pending
    ? "Queueing…"
    : runInFlight
    ? `Running… ${formatElapsed(elapsedMs)}`
    : status === "done"
    ? "Run again"
    : status === "failed"
    ? "Retry"
    : "Run agent";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleRun}
          disabled={disabled}
          className="bg-fern-700 hover:bg-fern-600 disabled:bg-white/10 disabled:text-white/40 text-white font-medium text-sm px-5 py-2.5 rounded-md transition disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>

        {blockedByStatus && (
          <span className="text-xs text-white/55">
            Agent is {agentStatus}. Change status in Settings to run.
          </span>
        )}

        {!blockedByStatus && status === "failed" && (
          <span className="text-xs text-red-400">
            Last run failed.
          </span>
        )}

        {!blockedByStatus && status === "done" && !runInFlight && (
          <span className="text-xs text-fern-300">
            Last run finished.
          </span>
        )}

        {enqueueError && !blockedByPreflight && (
          <span className="text-xs text-red-400">{enqueueError}</span>
        )}
      </div>

      {blockedByPreflight && preflight && "missing" in preflight && (
        <PreflightPanel
          missing={preflight.missing}
          agentTypeLabel={agentTypeLabel}
          onRefresh={refreshPreflight}
        />
      )}
    </div>
  );
}

function PreflightPanel({
  missing,
  agentTypeLabel,
  onRefresh,
}: {
  missing: MissingItem[];
  agentTypeLabel?: string;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#C89B3C]/35 bg-[#C89B3C]/[0.06] p-5 max-w-3xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Before this agent can run
          </h3>
          <p className="mt-1 text-xs text-white/70 leading-relaxed">
            {agentTypeLabel ? (
              <>
                <span className="text-white/85">{agentTypeLabel}</span> needs the items
                below before it can do its job. Each links you to where to fix it.
              </>
            ) : (
              "This agent needs the items below before it can do its job. Each links you to where to fix it."
            )}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-white/65 hover:text-white border border-white/15 rounded-md px-2.5 py-1 hover:bg-white/5 shrink-0"
        >
          Re-check
        </button>
      </header>

      <ul className="mt-4 space-y-2">
        {missing.map((m, i) => (
          <li key={i}>
            <MissingRow item={m} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MissingRow({ item }: { item: MissingItem }) {
  const icon =
    item.kind === "connection"
      ? "🔌"
      : item.kind === "knowledge"
      ? "📚"
      : "•";

  return (
    <Link
      href={item.fixHref}
      className="group block rounded-md border border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20 px-3 py-2.5 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <span className="text-base shrink-0" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-sm text-white truncate">{item.label}</div>
            <div className="text-xs text-white/55 truncate">
              {item.kind === "connection"
                ? `${item.sectionTitle} → Connections`
                : item.kind === "knowledge"
                ? item.hint ?? `${item.scope === "org" ? "Org" : "Agent"}-scoped knowledge doc`
                : ""}
            </div>
          </div>
        </div>
        <span className="text-fern-300 group-hover:text-fern-200 text-sm shrink-0">
          Fix →
        </span>
      </div>
    </Link>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
}
