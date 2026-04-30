"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";

import {
  approveMessage,
  escalateMessage,
} from "@/app/console/agents/[id]/actions";
import type { AgentDetailData, Message } from "@/lib/supabase/types";

type Filter = "all" | "inbound" | "outbound" | "pending" | "escalated";

export default function TimelineTab({ data }: { data: AgentDetailData }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = data.recent_messages.filter((m) => {
    if (filter === "all") return true;
    if (filter === "inbound") return m.direction === "inbound";
    if (filter === "outbound") return m.direction === "outbound";
    if (filter === "pending") return m.status === "pending_approval";
    if (filter === "escalated") return m.status === "escalated";
    return true;
  });

  if (data.recent_messages.length === 0) {
    return <EmptyState agentName={data.agent.name} />;
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-5">
        {(["all", "inbound", "outbound", "pending", "escalated"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-md transition capitalize ${
              filter === f
                ? "bg-white/10 text-white"
                : "text-white/55 hover:text-white hover:bg-white/5"
            }`}
          >
            {f}
            {f !== "all" && (
              <span className="ml-1.5 text-[10px] font-mono text-white/45">
                {data.recent_messages.filter((m) => {
                  if (f === "inbound") return m.direction === "inbound";
                  if (f === "outbound") return m.direction === "outbound";
                  if (f === "pending") return m.status === "pending_approval";
                  if (f === "escalated") return m.status === "escalated";
                  return false;
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-white/55 px-4 py-12 text-center">
          No messages match this filter.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              orgId={data.org.id}
              agentId={data.agent.id}
              open={openId === m.id}
              onToggle={() => setOpenId(openId === m.id ? null : m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageRow({
  m,
  agentId,
  open,
  onToggle,
}: {
  m: Message;
  orgId: string;
  agentId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      });
      if (!r.ok) setError(r.error);
    });
  }

  const dirIcon = m.direction === "inbound" ? "↓" : "↑";
  const statusColor = statusColorClass(m.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.035] transition"
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        <span className="text-white/45 font-mono mt-0.5 text-xs">{dirIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor}`}>
              {m.status.replace(/_/g, " ")}
            </span>
            <span className="text-sm text-white truncate">
              {m.subject || "(no subject)"}
            </span>
          </div>
          <div className="mt-1 text-xs text-white/55 line-clamp-1">
            {m.body_preview ?? ""}
          </div>
          <div className="mt-1 text-[10px] font-mono text-white/35">
            {m.direction === "inbound" ? `from ${m.from_addr}` : `to ${m.to_addr}`}
            <span className="mx-1.5">·</span>
            {timeAgo(m.created_at)}
          </div>
        </div>
        <span className={`text-white/35 transition-transform ${open ? "rotate-90" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-2">
            Body
          </div>
          <pre className="text-xs text-white/85 whitespace-pre-wrap font-sans leading-relaxed">
            {m.body || "(empty)"}
          </pre>

          {m.status === "pending_approval" && (
            <div className="mt-4 flex items-center gap-2">
              <button
                disabled={pending}
                onClick={approve}
                className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md transition disabled:opacity-50"
              >
                Approve &amp; send
              </button>
              <button
                disabled={pending}
                onClick={escalate}
                className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md transition disabled:opacity-50"
              >
                Escalate to human
              </button>
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ agentName }: { agentName: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-16 px-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h2.5l1.5-3 2 6 1.5-3H12" stroke="#7BB896"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-sm font-medium text-white">No activity yet.</div>
      <p className="mt-2 text-xs text-white/55 max-w-sm mx-auto">
        Once <span className="text-white/85">{agentName}</span> goes live, every email it
        reads, drafts, sends, and escalates will appear here in real time.
      </p>
    </div>
  );
}

function statusColorClass(status: Message["status"]): string {
  switch (status) {
    case "received":         return "bg-white/8 text-white/85";
    case "drafted":          return "bg-white/8 text-white/85";
    case "pending_approval": return "bg-[#C89B3C]/20 text-[#E8B85E] border border-[#C89B3C]/30";
    case "approved":         return "bg-fern-700/30 text-fern-300";
    case "sent":             return "bg-fern-700/30 text-fern-300";
    case "failed":           return "bg-red-900/30 text-red-300";
    case "escalated":        return "bg-red-900/20 text-red-300 border border-red-900/30";
  }
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
