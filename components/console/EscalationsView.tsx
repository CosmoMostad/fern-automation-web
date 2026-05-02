"use client";

import { useState, useTransition } from "react";

import { Sidebar, TopBar } from "@/components/console/Shell";
import {
  claimEscalation,
  resolveEscalation,
} from "@/app/console/agents/[id]/actions";
import type { EscalationsData, EscalationRow } from "@/lib/db/escalations";

const REASON_LABEL: Record<string, string> = {
  low_confidence:    "Low confidence",
  requested_human:   "Customer asked for a human",
  angry_tone:        "Angry tone detected",
  manual_flag:       "Manually flagged",
  policy_block:      "Policy block",
  other:             "Other",
};

export default function EscalationsView({ data }: { data: EscalationsData }) {
  return (
    <div className="grid grid-cols-[210px_1fr] min-h-screen">
      <Sidebar isDemo={false} />
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Escalations" }]}
        />
        <main className="overflow-y-auto p-8 max-w-4xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Escalations
            </h1>
            <p className="mt-1 text-sm text-white/65">
              Anything an agent decided needed a human. Claim one to take it,
              resolve when handled. Resolved items stay here for 30 days.
            </p>
          </header>

          <Section
            title="Open"
            count={data.open.length}
            emptyText="Nothing in the queue. Agents either resolved everything cleanly or it's quiet."
          >
            {data.open.map((row) => (
              <EscalationCard key={row.id} row={row} userId={data.user.id} kind="open" />
            ))}
          </Section>

          {data.recently_resolved.length > 0 && (
            <div className="mt-10">
              <Section title="Recently resolved" count={data.recently_resolved.length}>
                {data.recently_resolved.map((row) => (
                  <EscalationCard key={row.id} row={row} userId={data.user.id} kind="resolved" />
                ))}
              </Section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-white mb-3">
        {title} <span className="text-white/45 font-mono text-[10px]">{count}</span>
      </h2>
      {count === 0 && emptyText ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.015] px-5 py-10 text-center">
          <div className="text-sm text-white/70">{emptyText}</div>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

function EscalationCard({
  row,
  userId,
  kind,
}: {
  row: EscalationRow;
  userId: string;
  kind: "open" | "resolved";
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isMine = row.claimed_by === userId;

  function claim() {
    startTransition(async () => {
      const r = await claimEscalation({ escalationId: row.id });
      if (!r.ok) setError(r.error);
    });
  }

  function resolve() {
    startTransition(async () => {
      const r = await resolveEscalation({ escalationId: row.id, note });
      if (r.ok) {
        setOpen(false);
        setNote("");
      } else setError(r.error);
    });
  }

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.025]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <ReasonChip reason={row.reason} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">
            {row.message?.subject || "(no subject)"}
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-white/45 truncate">
            {row.agent?.name ?? "unknown agent"}
            <span className="mx-1.5">·</span>
            {row.message?.from_addr ?? ""}
            <span className="mx-1.5">·</span>
            {timeAgo(row.created_at)}
          </div>
        </div>
        <StatusPill row={row} isMine={isMine} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
              Why this was escalated
            </div>
            <div className="text-xs text-white/85">
              {REASON_LABEL[row.reason] ?? row.reason}
              {row.reason_detail && (
                <>
                  <span className="text-white/45"> — </span>
                  <span>{row.reason_detail}</span>
                </>
              )}
            </div>
          </div>

          {row.message && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                Message
              </div>
              <pre className="text-xs text-white/85 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded p-3">
                {row.message.body_preview ?? "(empty)"}
              </pre>
            </div>
          )}

          {row.resolution_note && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                Resolution note
              </div>
              <div className="text-xs text-white/85">{row.resolution_note}</div>
            </div>
          )}

          {kind === "open" && (
            <div className="border-t border-white/5 pt-3">
              {row.status === "open" && !row.claimed_by && (
                <button
                  disabled={pending}
                  onClick={claim}
                  className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  Claim
                </button>
              )}
              {row.status === "claimed" && isMine && (
                <div className="space-y-2">
                  <input
                    placeholder="Resolution note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
                  />
                  <button
                    disabled={pending}
                    onClick={resolve}
                    className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                </div>
              )}
              {row.status === "claimed" && !isMine && (
                <p className="text-xs text-white/45">Claimed by another teammate.</p>
              )}
              {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReasonChip({ reason }: { reason: string }) {
  const color =
    reason === "angry_tone" || reason === "policy_block"
      ? "bg-red-900/30 text-red-300 border-red-900/30"
      : reason === "low_confidence"
      ? "bg-[#C89B3C]/20 text-[#E8B85E] border-[#C89B3C]/30"
      : "bg-white/8 text-white/85 border-white/10";
  return (
    <span
      className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded border whitespace-nowrap ${color}`}
    >
      {reason.replace(/_/g, " ")}
    </span>
  );
}

function StatusPill({ row, isMine }: { row: EscalationRow; isMine: boolean }) {
  if (row.status === "open") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/65 whitespace-nowrap">
        open
      </span>
    );
  }
  if (row.status === "claimed") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider text-fern-300 whitespace-nowrap">
        {isMine ? "yours" : "claimed"}
      </span>
    );
  }
  if (row.status === "resolved") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/45 whitespace-nowrap">
        resolved
      </span>
    );
  }
  return (
    <span className="text-[10px] font-mono uppercase tracking-wider text-white/45 whitespace-nowrap">
      {row.status}
    </span>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
