"use client";

import Link from "next/link";
import { useState } from "react";

import { Sidebar, TopBar } from "@/components/console/Shell";
import type { InboxData } from "@/lib/db/inbox";
import type { Message } from "@/lib/supabase/types";

type AgentFilter = "all" | string; // "all" or agent_id

export default function InboxView({ data }: { data: InboxData }) {
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [direction, setDirection] = useState<"all" | "inbound" | "outbound">("all");

  const filtered = data.messages.filter((m) => {
    if (agentFilter !== "all" && m.agent_id !== agentFilter) return false;
    if (direction === "inbound" && m.direction !== "inbound") return false;
    if (direction === "outbound" && m.direction !== "outbound") return false;
    return true;
  });

  return (
    <div className="grid grid-cols-[210px_1fr] min-h-screen">
      <Sidebar isDemo={false} />
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Inbox" }]}
        />
        <main className="overflow-y-auto p-8 max-w-5xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Inbox
            </h1>
            <p className="mt-1 text-sm text-white/65">
              Every message every agent has seen. Click any row to jump to that
              agent&rsquo;s timeline.
            </p>
          </header>

          <div className="mb-5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {(["all", "inbound", "outbound"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`text-xs px-3 py-1.5 rounded-md transition capitalize ${
                    direction === d ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
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
                    agentFilter === "all" ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
                  }`}
                >
                  All agents
                </button>
                {data.agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAgentFilter(a.id)}
                    className={`text-xs px-3 py-1.5 rounded-md transition ${
                      agentFilter === a.id ? "bg-white/10 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1">
              {filtered.map((m) => (
                <InboxRow key={m.id} m={m} agents={data.agents} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
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
      <div className="flex items-center gap-3 text-xs">
        <span className="w-12 text-white/45 font-mono shrink-0">
          {m.direction === "inbound" ? "↓ in" : "↑ out"}
        </span>
        <StatusDot status={m.status} />
        <span className="text-white truncate flex-1 text-sm">
          {m.subject || "(no subject)"}
        </span>
        <span className="text-white/55 truncate w-48 hidden md:block">
          {m.direction === "inbound" ? m.from_addr : m.to_addr}
        </span>
        <span className="text-white/45 truncate w-32 hidden lg:block">
          {agent?.name ?? "—"}
        </span>
        <span className="text-white/35 font-mono w-20 text-right shrink-0">
          {timeAgo(m.created_at)}
        </span>
      </div>
      {m.body_preview && (
        <div className="mt-1 ml-[3.75rem] text-[11px] text-white/45 line-clamp-1">
          {m.body_preview}
        </div>
      )}
    </Link>
  );
}

function StatusDot({ status }: { status: Message["status"] }) {
  const color =
    status === "sent"             ? "bg-fern-500"
    : status === "approved"       ? "bg-fern-700"
    : status === "pending_approval" ? "bg-[#C89B3C] pulse-dot-amber"
    : status === "escalated"      ? "bg-red-500"
    : status === "failed"         ? "bg-red-500"
    : "bg-white/30";
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />;
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-16 px-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
          <path d="M2 8l1-5h8l1 5" stroke="#7BB896" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 8v3h10V8h-3l-1 1.5h-2L5 8H2z" stroke="#7BB896" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-sm font-medium text-white">Inbox is empty.</div>
      <p className="mt-2 text-xs text-white/55 max-w-sm mx-auto">
        Once any agent goes live, every message it touches will stream in here.
      </p>
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
