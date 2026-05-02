"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Sidebar, TopBar } from "./Shell";
import type { Agent, DashboardData, Event } from "@/lib/supabase/types";

type Props = {
  data: DashboardData;
  /** When set, the page is in demo-preview mode (not authed). */
  demo: string | null;
};

export default function Dashboard({ data, demo }: Props) {
  return (
    <div className="console-shell min-h-screen bg-[#0A1310] text-white grid grid-cols-[220px_1fr]">
      <Sidebar isDemo={demo !== null} />
      <div className="flex flex-col min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={demo !== null}
        />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] min-w-0 min-h-0">
          <MainContent data={data} />
          <ActivityRail data={data} />
        </main>
      </div>
    </div>
  );
}

/* ───────────── MAIN CONTENT ───────────── */

function MainContent({ data }: { data: DashboardData }) {
  const visibleAgents = data.agents.filter((a) => a.status !== "archived");

  return (
    <div className="p-8 overflow-y-auto bg-[#0A1310]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {visibleAgents.length === 0
              ? `Welcome, ${data.user.display_name}.`
              : `Welcome back, ${data.user.display_name}.`}
          </h1>
          <p className="mt-1 text-sm text-white/65">
            {visibleAgents.length === 0
              ? `${data.org.name}'s console is ready. Reach out to Fern to get your first agent live.`
              : `Click any agent to open its workspace.`}
          </p>
        </div>
        <SetupBadge status={data.org.setup_status} />
      </motion.div>

      {visibleAgents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid md:grid-cols-2 gap-3">
          {visibleAgents.map((a) => (
            <AgentCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Link
      href="/console/catalog"
      className="plain mt-8 block rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:border-fern-700/60 hover:bg-fern-700/[0.04] transition p-8 text-center"
    >
      <div className="mx-auto w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/55">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 4h14v3H3zM3 9h14v3H3zM3 14h14v3H3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-4 text-base font-semibold text-white">
        No agents yet
      </div>
      <p className="mt-1.5 text-sm text-white/65 max-w-md mx-auto">
        Browse the catalog to see what kinds of agents Fern has built.
        When something fits, reach out and we&rsquo;ll get it live in your
        console.
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-fern-300 font-medium">
        Open the catalog →
      </span>
    </Link>
  );
}

function SetupBadge({ status }: { status: DashboardData["org"]["setup_status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fern-700/30 border border-fern-700/40 text-xs text-fern-300">
        <span className="w-1.5 h-1.5 rounded-full bg-fern-500 pulse-dot" />
        All systems normal
      </span>
    );
  }
  if (status === "in-setup") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C89B3C]/20 border border-[#C89B3C]/30 text-xs text-[#E8B85E]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] pulse-dot-amber" />
        Pilot in setup
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/65">
      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
      Ready when you are
    </span>
  );
}

function Stat({
  label,
  value,
  suffix,
  quiet,
}: {
  label: string;
  value: string;
  suffix?: string;
  quiet?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-sm font-medium text-white/80">{label}</div>
      <div
        className={`mt-1.5 text-2xl font-semibold tracking-tight ${
          quiet ? "text-white/45" : "text-white"
        }`}
      >
        {value}
        {suffix && (
          <span className="text-sm text-white/55 ml-1.5 font-normal">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function AgentCard({ a }: { a: Agent }) {
  const dotClass =
    a.status === "live"
      ? "bg-fern-500 pulse-dot"
      : a.status === "in-build"
      ? "bg-[#C89B3C] pulse-dot-amber"
      : a.status === "paused"
      ? "bg-white/30"
      : "bg-white/30";
  const statusLabel =
    a.status === "live"
      ? "Live"
      : a.status === "in-build"
      ? "In build"
      : a.status === "paused"
      ? "Paused"
      : a.status === "archived"
      ? "Archived"
      : "Scoped";

  // Demo agents have hardcoded ids that don't exist in the DB; don't link them.
  const isDemo = a.id.startsWith("demo-") || a.id.startsWith("wsc-");
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.04] hover:border-white/20 transition p-5 cursor-pointer h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-xs font-medium text-white/75">
            {statusLabel}
          </span>
        </div>
        <span className="text-white/35 text-xs">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <div className="mt-3 text-sm font-medium text-white">{a.name}</div>
      {a.description && (
        <div className="mt-1 text-xs text-white/55 leading-relaxed">
          {a.description}
        </div>
      )}
    </motion.div>
  );

  if (isDemo) return inner;

  return (
    <Link href={`/console/agents/${a.id}`} className="plain block">
      {inner}
    </Link>
  );
}

/* ───────────── ACTIVITY RAIL ───────────── */

function ActivityRail({ data }: { data: DashboardData }) {
  const hasEvents = data.recent_events.length > 0;
  const visibleAgents = data.agents.filter((a) => a.status !== "archived");

  return (
    <aside className="border-l border-white/8 bg-[#06090A] p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Live activity</h3>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            hasEvents ? "bg-fern-500 pulse-dot" : "bg-white/30"
          }`}
        />
      </div>

      {hasEvents ? (
        <div className="mt-4 space-y-2.5">
          {data.recent_events.slice(0, 8).map((ev) => (
            <EventTile key={ev.id} ev={ev} agents={data.agents} />
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
            <svg width="20" height="24" viewBox="0 0 22 26" aria-hidden>
              <path
                d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z"
                fill="#52936B"
                fillOpacity="0.4"
              />
              <path
                d="M11 8C11 8 11 14 14 17"
                stroke="#7BB896"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>
          <div className="mt-4 text-sm font-medium text-white">
            No activity yet.
          </div>
          <p className="mt-2 text-xs text-white/65 leading-relaxed">
            {visibleAgents.length === 0
              ? "Once your first agent goes live, what it does shows up here in real time."
              : "Your agents are still in build. Activity starts streaming once they go live."}
          </p>
        </div>
      )}

      {visibleAgents.length > 0 && (
        <div className="mt-10 pt-6 border-t border-white/8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white/85">
              Build progress
            </span>
          </div>
          <div className="space-y-2">
            {visibleAgents.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-white/85 truncate pr-2">{a.name}</span>
                <span className="text-white/55 font-mono text-[11px] shrink-0">
                  {a.status === "live"
                    ? "live"
                    : a.status === "in-build"
                    ? "in build"
                    : a.status === "paused"
                    ? "paused"
                    : "scoped"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function EventTile({ ev, agents }: { ev: Event; agents: Agent[] }) {
  const agent = agents.find((a) => a.id === ev.agent_id);
  const tag = ev.type.replace(/_/g, " ");
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-fern-500" />
        <span className="font-medium text-white text-xs capitalize">
          {tag}
        </span>
        <span className="text-white/55 text-[10px] ml-auto font-mono">
          {timeAgo(ev.created_at)}
        </span>
      </div>
      <div className="mt-1.5 text-xs text-white/85 leading-snug">
        {ev.summary}
      </div>
      {agent && (
        <div className="text-[10px] text-white/45 mt-1.5 font-mono">
          via {agent.name}
        </div>
      )}
    </motion.div>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
