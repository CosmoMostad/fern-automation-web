"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import RequestAgentModal from "./RequestAgentModal";
import type { Agent, DashboardData, Event } from "@/lib/supabase/types";

type Props = {
  data: DashboardData;
  /** When set, the page is in demo-preview mode (not authed). */
  demo: string | null;
};

export default function Dashboard({ data, demo }: Props) {
  const [reqOpen, setReqOpen] = useState(false);

  return (
    <div className="grid grid-cols-[210px_1fr] min-h-screen">
      <Sidebar isDemo={demo !== null} />
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={demo !== null}
        />
        <main className="grid grid-cols-[1fr_320px] min-w-0">
          <MainContent data={data} onRequest={() => setReqOpen(true)} />
          <ActivityRail data={data} />
        </main>
      </div>
      <RequestAgentModal
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        orgId={data.org.id.startsWith("demo-") ? null : data.org.id}
      />
    </div>
  );
}

/* ───────────── SIDEBAR ───────────── */

function Sidebar({ isDemo }: { isDemo: boolean }) {
  return (
    <aside className="border-r border-white/8 bg-[#06090A] p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2 py-2 mb-3">
        <FernMark />
        <span className="text-sm font-medium tracking-tight">fern</span>
      </div>

      <NavItem icon={<IconAgents />} label="Agents" active />
      <NavItem icon={<IconActivity />} label="Activity" />
      <NavItem icon={<IconInbox />} label="Inbox" />
      <NavItem icon={<IconVoice />} label="Voice" />
      <NavItem icon={<IconReports />} label="Reports" />

      <div className="mt-auto">
        <NavItem icon={<IconSettings />} label="Settings" />
        {isDemo ? (
          <Link
            href="/"
            className="plain flex items-center gap-2 mt-2 px-3 py-2 text-xs text-white/60 hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M7 9L4 6l3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            back to fernautomation.com
          </Link>
        ) : (
          <form
            action="/console/auth/signout"
            method="post"
            className="mt-2"
          >
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white w-full text-left"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M5 9L8 6L5 3M8 6H1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full text-left transition ${
        active
          ? "bg-white/8 text-white"
          : "text-white/55 hover:text-white hover:bg-white/4"
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

/* ───────────── TOP BAR ───────────── */

function TopBar({
  business,
  user,
  isDemo,
}: {
  business: string;
  user: string;
  isDemo: boolean;
}) {
  return (
    <header className="border-b border-white/8 px-6 flex items-center justify-between bg-[#0A1310]">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-white">{business}</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-xs text-white/55">Console</span>
        {isDemo && (
          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-[#C89B3C] px-2 py-0.5 rounded bg-[#C89B3C]/15 border border-[#C89B3C]/25">
            Demo
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="text-xs text-white/55 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition">
          Help
        </button>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition">
          <div className="w-6 h-6 rounded-full bg-fern-700 text-white text-[10px] font-semibold flex items-center justify-center">
            {user.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-white/85">{user}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2.5 4 L5 6.5 L7.5 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/55"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}

/* ───────────── MAIN CONTENT ───────────── */

function MainContent({
  data,
  onRequest,
}: {
  data: DashboardData;
  onRequest: () => void;
}) {
  const liveCount = data.agents.filter((a) => a.status === "live").length;
  const inBuildCount = data.agents.filter((a) => a.status === "in-build").length;
  const scopedCount = data.agents.filter((a) => a.status === "scoped").length;

  return (
    <div className="p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {data.agents.length === 0
              ? `Welcome to your console, ${data.user.display_name}.`
              : `Welcome back, ${data.user.display_name}.`}
          </h1>
          <p className="mt-1 text-sm text-white/65">
            {data.agents.length === 0
              ? `This is where ${data.org.name}'s agents will live. Add the first one whenever you're ready.`
              : `${liveCount} live · ${inBuildCount} in build · ${scopedCount} scoped`}
          </p>
        </div>
        <SetupBadge status={data.org.setup_status} />
      </motion.div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Active agents"
          value={liveCount.toString()}
          suffix={data.agents.length > 0 ? `/ ${data.agents.length}` : ""}
        />
        <Stat label="Activity today" value={data.todays_activity_count.toString()} />
        <Stat label="Replies sent" value={data.todays_replies_count.toString()} />
        <Stat
          label="Avg response"
          value={
            data.avg_response_seconds == null
              ? "—"
              : data.avg_response_seconds < 60
              ? `${Math.round(data.avg_response_seconds)}s`
              : `${(data.avg_response_seconds / 60).toFixed(1)}m`
          }
          quiet={data.avg_response_seconds == null}
        />
      </div>

      <div className="mt-10 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Your agents</h2>
          <p className="mt-0.5 text-xs text-white/55">
            {data.agents.length === 0
              ? "An agent is one focused job, built for your business."
              : `${data.agents.length} ${data.agents.length === 1 ? "agent" : "agents"} in your console.`}
          </p>
        </div>
        <button
          onClick={onRequest}
          className="inline-flex items-center gap-1.5 bg-fern-700 hover:bg-fern-600 text-white text-sm font-medium px-4 py-2 rounded-full transition"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 2v8M2 6h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Request a new agent
        </button>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-3">
        {data.agents.length === 0 ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <EmptyAgentSlot key={i} index={i} onRequest={onRequest} />
            ))}
          </>
        ) : (
          data.agents.map((a) => <AgentCard key={a.id} a={a} />)
        )}
      </div>

      {data.agents.length === 0 && (
        <p className="mt-5 text-xs text-white/45">
          The dashed slots above show roughly where agent cards will live.
          Once you request your first agent, this view fills in.
        </p>
      )}
    </div>
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
      <div className="text-[10px] font-mono uppercase tracking-wider text-white/55">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          quiet ? "text-white/40" : "text-white"
        }`}
      >
        {value}
        {suffix && (
          <span className="text-sm text-white/45 ml-1.5 font-normal">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyAgentSlot({
  index,
  onRequest,
}: {
  index: number;
  onRequest: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={onRequest}
      className="group rounded-xl border border-dashed border-white/15 bg-white/[0.015] hover:border-fern-700/60 hover:bg-fern-700/[0.04] transition p-5 text-left min-h-[140px] flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/35 group-hover:text-fern-400">
          Empty slot · {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-white/20 group-hover:text-fern-400 transition">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      <div>
        <div className="text-sm font-medium text-white/45 group-hover:text-white">
          An agent will live here.
        </div>
        <div className="mt-1 text-xs text-white/35 group-hover:text-white/65">
          Tell me what you need and I&rsquo;ll scope it.
        </div>
      </div>
    </motion.button>
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
      className="rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.04] transition p-5 cursor-pointer h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/65">
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

  return (
    <aside className="border-l border-white/8 bg-[#0A1310] p-6 overflow-y-auto">
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
          <p className="mt-2 text-xs text-white/55 leading-relaxed">
            {data.agents.length === 0
              ? "Once your first agent goes live, what it does shows up here in real time."
              : "Your agents are still in build. Activity starts streaming once they go live."}
          </p>
        </div>
      )}

      {data.agents.length > 0 && (
        <div className="mt-10 pt-6 border-t border-white/8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/55">
              Build progress
            </span>
          </div>
          <div className="space-y-2">
            {data.agents.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-white/72 truncate pr-2">{a.name}</span>
                <span className="text-white/45 font-mono shrink-0">
                  {a.status === "live"
                    ? "live"
                    : a.status === "in-build"
                    ? "in build"
                    : a.status === "paused"
                    ? "paused"
                    : a.status === "archived"
                    ? "archived"
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
      className="text-xs bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-fern-500" />
        <span className="font-medium text-white text-[11px] capitalize">
          {tag}
        </span>
        <span className="text-white/45 text-[10px] ml-auto font-mono">
          {timeAgo(ev.created_at)}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-white/72 leading-snug">
        {ev.summary}
      </div>
      {agent && (
        <div className="text-[9px] text-white/35 mt-1 font-mono">
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

/* ───────────── ICONS + BRAND ───────────── */

function FernMark() {
  return (
    <svg width="18" height="22" viewBox="0 0 22 26" aria-hidden>
      <path
        d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z"
        fill="#7BB896"
      />
      <path
        d="M11 8C11 8 11 14 14 17"
        stroke="#A8C49A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const stroke = "currentColor";
function IconAgents() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="4" height="4" rx="0.5" />
      <rect x="8" y="3" width="4" height="4" rx="0.5" />
      <rect x="2" y="9" width="4" height="3" rx="0.5" />
      <rect x="8" y="9" width="4" height="3" rx="0.5" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7h2.5l1.5-3 2 6 1.5-3H12" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l1-5h8l1 5" />
      <path d="M2 8v3h10V8h-3l-1 1.5h-2L5 8H2z" />
    </svg>
  );
}
function IconVoice() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="4" height="7" rx="2" />
      <path d="M3 8a4 4 0 0 0 8 0" />
      <path d="M7 12v0" />
    </svg>
  );
}
function IconReports() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="10" height="10" rx="1" />
      <path d="M5 9V6M7 9V4M9 9V7" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2" />
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4" />
    </svg>
  );
}
