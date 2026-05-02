"use client";

import { useState, useTransition } from "react";

import {
  approveMessage,
  escalateMessage,
} from "@/app/console/agents/[id]/actions";
import type { AgentDetailData, Message } from "@/lib/supabase/types";

/**
 * Leads tab — for corporate_event_hunter agents.
 *
 * Each lead = an outbound draft the agent created based on a public-news
 * signal (funding round, hiring spree, expansion). Operator reviews each
 * one, edits if needed, approves to send. Identical approval contract as
 * the prospects view but tailored for B2B event-sales drafts.
 */
export default function LeadsTab({ data }: { data: AgentDetailData }) {
  const drafts = data.recent_messages
    .filter((m) => m.direction === "outbound")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const pending = drafts.filter((m) => m.status === "pending_approval");
  const sent = drafts.filter(
    (m) => m.status === "sent" || m.status === "approved"
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Awaiting approval"
          value={pending.length.toString()}
          warn={pending.length > 0}
        />
        <Stat label="Sent / approved" value={sent.length.toString()} />
        <Stat
          label="Lookback"
          value={
            ((data.agent.config as Record<string, unknown>)?.lookback_days as
              | number
              | undefined)?.toString() ?? "—"
          }
          suffix="days"
        />
        <Stat
          label="Min confidence"
          value={
            ((data.agent.config as Record<string, unknown>)?.min_confidence as
              | number
              | undefined)?.toString() ?? "—"
          }
          suffix="/10"
        />
      </div>

      {pending.length === 0 && sent.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-12 px-6 text-center">
          <div className="text-sm font-medium text-white">No leads yet.</div>
          <p className="mt-1.5 text-sm text-white/65 max-w-md mx-auto">
            This agent runs on a weekly schedule. After its next run, every
            company it identifies (with a drafted outreach email) will land
            here for your approval.
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <Section title="Awaiting approval" count={pending.length}>
              {pending.map((m) => (
                <LeadCard key={m.id} m={m} agentId={data.agent.id} />
              ))}
            </Section>
          )}
          {sent.length > 0 && (
            <Section
              title="Sent / approved"
              count={sent.length}
              dimmed
            >
              {sent.slice(0, 10).map((m) => (
                <LeadCard key={m.id} m={m} agentId={data.agent.id} compact />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  dimmed,
  children,
}: {
  title: string;
  count: number;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={dimmed ? "opacity-90" : undefined}>
      <h3 className="text-sm font-semibold text-white/85 mb-3">
        {title}
        <span className="ml-1.5 text-xs text-white/45">{count}</span>
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function LeadCard({
  m,
  agentId,
  compact,
}: {
  m: Message;
  agentId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact && m.status === "pending_approval");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Reach into llm_input for the company / signal context the agent extracted
  const llmInput = (m.llm_input ?? {}) as Record<string, unknown>;
  const company =
    (llmInput.company as string | undefined) ??
    (llmInput.organization as string | undefined) ??
    null;
  const signal =
    (llmInput.signal as string | undefined) ??
    (llmInput.signal_summary as string | undefined) ??
    null;

  function approve() {
    setError(null);
    startTransition(async () => {
      const r = await approveMessage({ messageId: m.id, agentId });
      if (!r.ok) setError(r.error);
    });
  }
  function escalate() {
    setError(null);
    startTransition(async () => {
      const r = await escalateMessage({
        messageId: m.id,
        agentId,
        reason: "manual_flag",
        detail: "Reviewer flagged for human follow-up.",
      });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025]">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {m.subject ?? "(no subject)"}
          </div>
          <div className="mt-0.5 text-xs text-white/55 flex items-center gap-2 flex-wrap">
            {company && <span>{company}</span>}
            {company && m.to_addr && <span>·</span>}
            {m.to_addr && <span className="font-mono">{m.to_addr}</span>}
          </div>
          {signal && (
            <div className="mt-1 text-sm text-white/75 line-clamp-1">
              <span className="text-white/45 mr-1.5">signal:</span>
              {signal}
            </div>
          )}
        </div>
        <StatusPill status={m.status} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div>
            <div className="text-xs font-medium text-white/65 mb-1">Draft</div>
            <pre className="text-sm text-white/85 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded p-3">
              {m.body ?? m.body_preview ?? "(empty)"}
            </pre>
          </div>

          {m.status === "pending_approval" && (
            <div className="border-t border-white/5 pt-3 flex items-center gap-3">
              <button
                onClick={approve}
                disabled={pending}
                className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition"
              >
                {pending ? "Approving…" : "Approve & send"}
              </button>
              <button
                onClick={escalate}
                disabled={pending}
                className="text-sm text-white/65 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition"
              >
                Escalate
              </button>
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Message["status"] }) {
  const tone =
    status === "pending_approval"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : status === "sent" || status === "approved"
      ? "bg-fern-700/15 text-fern-300 border-fern-700/30"
      : status === "escalated"
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : "bg-white/5 text-white/55 border-white/10";
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Stat({
  label,
  value,
  suffix,
  warn,
}: {
  label: string;
  value: string;
  suffix?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
      <div className="text-xs font-medium text-white/75">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold ${
          warn ? "text-[#E8B85E]" : "text-white"
        }`}
      >
        {value}
        {suffix && (
          <span className="text-xs font-normal text-white/55 ml-1">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
