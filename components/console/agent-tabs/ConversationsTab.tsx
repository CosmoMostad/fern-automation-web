"use client";

import Link from "next/link";

import type { AgentDetailData, Thread } from "@/lib/supabase/types";

/**
 * Conversations tab — for customer_qa agents.
 *
 * Lists every thread the agent is currently handling, with the latest
 * inbound + the drafted outbound side-by-side. Click a thread to expand
 * inline. Shows aggregate counts at the top so the operator gets an
 * at-a-glance read on the day.
 */
export default function ConversationsTab({ data }: { data: AgentDetailData }) {
  const threads = data.recent_threads;
  const today = new Date().toISOString().slice(0, 10);

  const todaysMessages = data.recent_messages.filter((m) =>
    m.created_at.startsWith(today)
  );
  const inboundToday = todaysMessages.filter(
    (m) => m.direction === "inbound"
  ).length;
  const draftsToday = todaysMessages.filter(
    (m) =>
      m.direction === "outbound" &&
      (m.status === "pending_approval" ||
        m.status === "approved" ||
        m.status === "sent")
  ).length;
  const escalationsToday = todaysMessages.filter(
    (m) => m.status === "escalated"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Open threads" value={threads.length.toString()} />
        <Stat label="Inbound today" value={inboundToday.toString()} />
        <Stat label="Drafted today" value={draftsToday.toString()} />
        <Stat
          label="Escalated today"
          value={escalationsToday.toString()}
          warn={escalationsToday > 0}
        />
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-12 px-6 text-center">
          <div className="text-sm font-medium text-white">
            No conversations yet.
          </div>
          <p className="mt-1.5 text-sm text-white/65 max-w-md mx-auto">
            When inbound emails arrive, this agent classifies them and either
            drafts a reply or escalates. Each ongoing thread shows up here.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-white/85 mb-3">
            Active threads
          </h3>
          <div className="space-y-2">
            {threads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                messages={data.recent_messages}
                agentId={data.agent.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadCard({
  thread,
  messages,
  agentId,
}: {
  thread: Thread;
  messages: AgentDetailData["recent_messages"];
  agentId: string;
}) {
  const threadMsgs = messages
    .filter((m) => m.thread_id === thread.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const latestInbound = threadMsgs.find((m) => m.direction === "inbound");
  const latestOutbound = threadMsgs.find((m) => m.direction === "outbound");
  const status = latestOutbound?.status ?? "received";
  const tone =
    status === "pending_approval"
      ? "border-amber-500/30 bg-amber-500/5"
      : status === "escalated"
      ? "border-red-500/30 bg-red-500/5"
      : status === "sent" || status === "approved"
      ? "border-fern-700/30 bg-fern-700/5"
      : "border-white/8 bg-white/[0.02]";

  return (
    <Link
      href={`/console/agents/${agentId}?tab=timeline`}
      className={`plain block rounded-lg border p-4 hover:border-white/20 transition ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {thread.contact_name || thread.contact_email || "(unknown contact)"}
          </div>
          <div className="mt-0.5 text-xs text-white/55 truncate">
            {thread.subject ?? "(no subject)"}
          </div>
        </div>
        <StatusBadge status={status} threadStatus={thread.status} />
      </div>

      {latestInbound?.body_preview && (
        <div className="mt-3 text-sm text-white/75 leading-relaxed line-clamp-2">
          <span className="text-white/45 mr-1.5">↓</span>
          {latestInbound.body_preview}
        </div>
      )}
      {latestOutbound?.body_preview && (
        <div className="mt-1.5 text-sm text-fern-300 leading-relaxed line-clamp-2">
          <span className="text-white/45 mr-1.5">↑</span>
          {latestOutbound.body_preview}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-white/45">
        <span>{thread.message_count} messages</span>
        <span>{timeAgo(thread.last_message_at)}</span>
      </div>
    </Link>
  );
}

function StatusBadge({
  status,
  threadStatus,
}: {
  status: string;
  threadStatus: string;
}) {
  const display =
    threadStatus === "escalated"
      ? "Escalated"
      : status === "pending_approval"
      ? "Awaiting approval"
      : status === "sent"
      ? "Replied"
      : status === "approved"
      ? "Approved"
      : status === "escalated"
      ? "Escalated"
      : status === "received"
      ? "Inbound"
      : status;
  const color =
    display === "Escalated"
      ? "text-red-300 bg-red-500/15 border-red-500/30"
      : display === "Awaiting approval"
      ? "text-amber-300 bg-amber-500/15 border-amber-500/30"
      : display === "Replied" || display === "Approved"
      ? "text-fern-300 bg-fern-700/15 border-fern-700/30"
      : "text-white/65 bg-white/8 border-white/10";
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded border whitespace-nowrap ${color}`}
    >
      {display}
    </span>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
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
      </div>
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
