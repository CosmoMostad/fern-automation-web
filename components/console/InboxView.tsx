"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Sidebar, TopBar } from "@/components/console/Shell";
import {
  claimEscalation,
  resolveEscalation,
} from "@/app/console/agents/[id]/actions";
import type { EscalationWithLinks, InboxData } from "@/lib/db/inbox";
import type { Message } from "@/lib/supabase/types";

type Pane = "messages" | "escalations";

export default function InboxView({ data }: { data: InboxData }) {
  const [pane, setPane] = useState<Pane>(
    data.escalations_open.length > 0 ? "escalations" : "messages"
  );
  const [agentFilter, setAgentFilter] = useState<"all" | string>("all");
  const [direction, setDirection] = useState<"all" | "inbound" | "outbound">(
    "all"
  );

  const filteredMsgs = data.messages.filter((m) => {
    if (agentFilter !== "all" && m.agent_id !== agentFilter) return false;
    if (direction === "inbound" && m.direction !== "inbound") return false;
    if (direction === "outbound" && m.direction !== "outbound") return false;
    return true;
  });

  return (
    <div className="console-shell grid grid-cols-[220px_1fr] min-h-screen bg-[#0A1310] text-white">
      <Sidebar isDemo={false} />
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Inbox" }]}
        />
        <main className="overflow-y-auto p-8 max-w-5xl">
          <header className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Inbox
            </h1>
            <p className="mt-1 text-sm text-white/65">
              Every message every agent has seen, plus anything they bumped to
              a human. Two views, one queue.
            </p>
          </header>

          <nav className="mb-6 flex items-center gap-1 border-b border-white/8 pb-px">
            <PaneTab
              active={pane === "messages"}
              onClick={() => setPane("messages")}
              label="Messages"
              count={data.messages.length}
            />
            <PaneTab
              active={pane === "escalations"}
              onClick={() => setPane("escalations")}
              label="Escalations"
              count={data.escalations_open.length}
              warn={data.escalations_open.length > 0}
            />
          </nav>

          {pane === "messages" ? (
            <MessagesPane
              data={data}
              filteredMessages={filteredMsgs}
              agentFilter={agentFilter}
              setAgentFilter={setAgentFilter}
              direction={direction}
              setDirection={setDirection}
            />
          ) : (
            <EscalationsPane data={data} />
          )}
        </main>
      </div>
    </div>
  );
}

function PaneTab({
  active,
  onClick,
  label,
  count,
  warn,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  warn?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm border-b-2 transition -mb-px ${
        active
          ? "border-fern-500 text-white"
          : "border-transparent text-white/55 hover:text-white"
      }`}
    >
      {label}
      <span
        className={`ml-2 text-xs ${
          warn ? "text-[#E8B85E]" : active ? "text-white/65" : "text-white/35"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ───────────── MESSAGES PANE ───────────── */

function MessagesPane({
  data,
  filteredMessages,
  agentFilter,
  setAgentFilter,
  direction,
  setDirection,
}: {
  data: InboxData;
  filteredMessages: Message[];
  agentFilter: "all" | string;
  setAgentFilter: (v: "all" | string) => void;
  direction: "all" | "inbound" | "outbound";
  setDirection: (v: "all" | "inbound" | "outbound") => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "inbound", "outbound"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`text-xs px-3 py-1.5 rounded-md transition capitalize ${
                direction === d
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {data.agents.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setAgentFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-md transition ${
                agentFilter === "all"
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              All agents
            </button>
            {data.agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgentFilter(a.id)}
                className={`text-xs px-3 py-1.5 rounded-md transition ${
                  agentFilter === a.id
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredMessages.length === 0 ? (
        <EmptyMessages />
      ) : (
        <div className="space-y-1">
          {filteredMessages.map((m) => (
            <InboxRow key={m.id} m={m} agents={data.agents} />
          ))}
        </div>
      )}
    </>
  );
}

function InboxRow({
  m,
  agents,
}: {
  m: Message;
  agents: InboxData["agents"];
}) {
  const agent = agents.find((a) => a.id === m.agent_id);
  return (
    <Link
      href={m.agent_id ? `/console/agents/${m.agent_id}?tab=timeline` : "#"}
      className="plain block rounded-md hover:bg-white/[0.03] px-3 py-2.5 transition"
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="w-12 text-white/55 font-mono text-xs shrink-0">
          {m.direction === "inbound" ? "↓ in" : "↑ out"}
        </span>
        <StatusDot status={m.status} />
        <span className="text-white truncate flex-1">
          {m.subject || "(no subject)"}
        </span>
        <span className="text-white/65 truncate w-48 hidden md:block text-xs">
          {m.direction === "inbound" ? m.from_addr : m.to_addr}
        </span>
        <span className="text-white/55 truncate w-32 hidden lg:block text-xs">
          {agent?.name ?? "—"}
        </span>
        <span className="text-white/45 font-mono w-20 text-right shrink-0 text-xs">
          {timeAgo(m.created_at)}
        </span>
      </div>
      {m.body_preview && (
        <div className="mt-1 ml-[3.75rem] text-xs text-white/55 line-clamp-1">
          {m.body_preview}
        </div>
      )}
    </Link>
  );
}

function StatusDot({ status }: { status: Message["status"] }) {
  const color =
    status === "sent"
      ? "bg-fern-500"
      : status === "approved"
      ? "bg-fern-700"
      : status === "pending_approval"
      ? "bg-[#C89B3C] pulse-dot-amber"
      : status === "escalated"
      ? "bg-red-500"
      : status === "failed"
      ? "bg-red-500"
      : "bg-white/30";
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />;
}

function EmptyMessages() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-16 px-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 text-white/55">
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 8l1-5h8l1 5M2 8v3h10V8h-3l-1 1.5h-2L5 8H2z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="text-sm font-medium text-white">Inbox is empty.</div>
      <p className="mt-2 text-sm text-white/65 max-w-sm mx-auto">
        Once any agent goes live, every message it touches streams in here.
      </p>
    </div>
  );
}

/* ───────────── ESCALATIONS PANE ───────────── */

const REASON_LABEL: Record<string, string> = {
  low_confidence: "Low confidence",
  requested_human: "Customer asked for a human",
  angry_tone: "Angry tone detected",
  manual_flag: "Manually flagged",
  policy_block: "Policy block",
  other: "Other",
};

function EscalationsPane({ data }: { data: InboxData }) {
  return (
    <>
      <Section
        title="Open"
        count={data.escalations_open.length}
        emptyText="Nothing in the queue. Agents either resolved everything cleanly or it's quiet."
      >
        {data.escalations_open.map((row) => (
          <EscalationCard
            key={row.id}
            row={row}
            userId={data.user.id}
            kind="open"
          />
        ))}
      </Section>

      {data.escalations_resolved.length > 0 && (
        <div className="mt-10">
          <Section
            title="Recently resolved"
            count={data.escalations_resolved.length}
          >
            {data.escalations_resolved.map((row) => (
              <EscalationCard
                key={row.id}
                row={row}
                userId={data.user.id}
                kind="resolved"
              />
            ))}
          </Section>
        </div>
      )}
    </>
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
        {title} <span className="text-white/55 text-xs ml-1">{count}</span>
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
  row: EscalationWithLinks;
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
          <div className="mt-0.5 text-xs text-white/55 truncate">
            {row.agent?.name ?? "unknown agent"}
            <span className="mx-1.5">·</span>
            {row.message?.from_addr ?? ""}
            <span className="mx-1.5">·</span>
            {timeAgo(row.created_at)}
          </div>
        </div>
        <StatusPill status={row.status} isMine={isMine} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          <div>
            <div className="text-xs font-medium text-white/65 mb-1">
              Why this was escalated
            </div>
            <div className="text-sm text-white/85">
              {REASON_LABEL[row.reason] ?? row.reason}
              {row.reason_detail && (
                <>
                  <span className="text-white/55"> — </span>
                  <span>{row.reason_detail}</span>
                </>
              )}
            </div>
          </div>

          {row.message && (
            <div>
              <div className="text-xs font-medium text-white/65 mb-1">
                Message
              </div>
              <pre className="text-sm text-white/85 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded p-3">
                {row.message.body_preview ?? "(empty)"}
              </pre>
            </div>
          )}

          {row.resolution_note && (
            <div>
              <div className="text-xs font-medium text-white/65 mb-1">
                Resolution note
              </div>
              <div className="text-sm text-white/85">{row.resolution_note}</div>
            </div>
          )}

          {kind === "open" && (
            <div className="border-t border-white/5 pt-3">
              {row.status === "open" && !row.claimed_by && (
                <button
                  disabled={pending}
                  onClick={claim}
                  className="text-sm bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
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
                    className="text-sm bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                </div>
              )}
              {row.status === "claimed" && !isMine && (
                <p className="text-sm text-white/55">
                  Claimed by another teammate.
                </p>
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
      className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded border whitespace-nowrap ${color}`}
    >
      {reason.replace(/_/g, " ")}
    </span>
  );
}

function StatusPill({
  status,
  isMine,
}: {
  status: string;
  isMine: boolean;
}) {
  if (status === "open")
    return (
      <span className="text-xs font-medium text-white/65 whitespace-nowrap">
        open
      </span>
    );
  if (status === "claimed")
    return (
      <span className="text-xs font-medium text-fern-300 whitespace-nowrap">
        {isMine ? "yours" : "claimed"}
      </span>
    );
  if (status === "resolved")
    return (
      <span className="text-xs font-medium text-white/55 whitespace-nowrap">
        resolved
      </span>
    );
  return (
    <span className="text-xs font-medium text-white/55 whitespace-nowrap">
      {status}
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
