"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function ConsoleSection() {
  return (
    <section
      id="console"
      className="relative bg-[#0A1310] text-white pt-24 pb-28 px-6 md:px-10 overflow-hidden"
    >
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-fern-700/20 blur-[120px]" />
      </div>

      <div className="max-w-page mx-auto relative-z">
        <SectionHeader
          label="Your console"
          title="Manage every agent in one place."
          body="A custom dashboard, scoped to your business — not someone else's CRM. Watch what each agent is doing, approve drafts, edit voice, pause and resume. Built into the proposal, not sold separately."
        />

        <div className="mt-14">
          <ConsoleMockup />
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fern-500">
          {label}
        </p>
        <h2 className="mt-3 text-white max-w-[18ch]">{title}</h2>
      </div>
      <p className="text-white/65 text-base leading-relaxed">{body}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   CONSOLE MOCKUP
   ────────────────────────────────────────────── */

const initialAgents = [
  {
    name: "Inbound chat",
    status: "active" as const,
    last: "Replied to Jenna — booking confirmed",
    countLabel: "Today",
    countStart: 24,
  },
  {
    name: "Lead follow-up",
    status: "active" as const,
    last: "Sent 6 first-touch emails",
    countLabel: "Today",
    countStart: 6,
  },
  {
    name: "Review responder",
    status: "drafting" as const,
    last: "Drafting reply to David M.",
    countLabel: "This week",
    countStart: 11,
  },
  {
    name: "No-show prevention",
    status: "active" as const,
    last: "Confirmed 4 of 5 tomorrow",
    countLabel: "Tomorrow",
    countStart: 4,
  },
  {
    name: "Weekly report",
    status: "scheduled" as const,
    last: "Sends Monday 8:00am",
    countLabel: "Cadence",
    countStart: 0,
    countText: "Mon · 8am",
  },
  {
    name: "Internal Slack",
    status: "idle" as const,
    last: "Awaiting trigger",
    countLabel: "Idle for",
    countStart: 0,
    countText: "2h 14m",
  },
];

type Activity = {
  agent: string;
  action: string;
  detail: string;
  timeAgo: string;
  color: string;
};

const activityPool: Activity[] = [
  { agent: "Inbound chat", action: "Booked", detail: "Sarah K. · Thu 2:00pm", timeAgo: "just now", color: "#7BB896" },
  { agent: "Lead follow-up", action: "Sent", detail: "Reply to Marcus L.", timeAgo: "1m ago", color: "#7BB896" },
  { agent: "Review responder", action: "Drafted", detail: "5★ from David M.", timeAgo: "3m ago", color: "#C89B3C" },
  { agent: "Inbound chat", action: "Answered", detail: "Hours question · no booking", timeAgo: "4m ago", color: "#A8C49A" },
  { agent: "No-show prevention", action: "Confirmed", detail: "Priya N. · tomorrow 10am", timeAgo: "7m ago", color: "#7BB896" },
  { agent: "Lead follow-up", action: "Sent", detail: "Reply to Jenna T. · 42s", timeAgo: "11m ago", color: "#7BB896" },
  { agent: "Inbound chat", action: "Booked", detail: "Marcus L. · Fri 11:30am", timeAgo: "14m ago", color: "#7BB896" },
  { agent: "Review responder", action: "Posted", detail: "Reply to Amanda R.", timeAgo: "22m ago", color: "#C89B3C" },
];

function ConsoleMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.25 });

  // ticking activity feed
  const [feed, setFeed] = useState<Activity[]>(activityPool.slice(0, 5));
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % activityPool.length;
      setFeed((prev) => [activityPool[i], ...prev.slice(0, 4)]);
    }, 3500);
    return () => clearInterval(id);
  }, [inView]);

  // ticking counters for first two agents
  const [counts, setCounts] = useState(initialAgents.map((a) => a.countStart));
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setCounts((prev) =>
        prev.map((c, i) =>
          initialAgents[i].status === "active" ? c + (Math.random() < 0.4 ? 1 : 0) : c
        )
      );
    }, 2200);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="rounded-2xl border border-white/10 bg-[#0F1A15] shadow-2xl overflow-hidden"
    >
      {/* browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="text-[10px] font-mono text-white/45 px-3 py-1 rounded-md bg-white/5 border border-white/8">
          console.fernautomation.com / your-business
        </div>
        <div className="w-12" />
      </div>

      <div className="grid grid-cols-[180px_1fr_280px] min-h-[480px]">
        {/* sidebar */}
        <aside className="border-r border-white/8 p-4">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-5">
            <svg width="14" height="18" viewBox="0 0 22 26" aria-hidden>
              <path d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z" fill="#7BB896" />
              <path d="M11 8C11 8 11 14 14 17" stroke="#1C3D2A" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-medium text-white">your business</span>
          </div>
          <NavItem label="Agents" active />
          <NavItem label="Activity" />
          <NavItem label="Inbox" badge="3" />
          <NavItem label="Voice" />
          <NavItem label="Reports" />
          <NavItem label="Settings" />

          <div className="mt-8 pt-4 border-t border-white/8">
            <div className="text-[9px] font-mono uppercase tracking-wider text-white/35 px-2">
              status
            </div>
            <div className="mt-2 px-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-fern-500 pulse-dot" />
              <span className="text-[10px] text-white/65">all systems normal</span>
            </div>
          </div>
        </aside>

        {/* main */}
        <main className="p-5 border-r border-white/8 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Active agents
              </div>
              <div className="text-base font-medium text-white mt-1">
                6 agents · 4 running
              </div>
            </div>
            <button className="text-[11px] font-medium text-white/75 px-3 py-1.5 rounded-md border border-white/15 hover:bg-white/5">
              + new agent
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {initialAgents.map((a, i) => (
              <AgentTile key={a.name} a={a} count={counts[i]} delay={i * 0.06} inView={inView} />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <Stat label="Replies sent" value="47" delta="+12 today" />
            <Stat label="Bookings" value="9" delta="+2 today" />
            <Stat label="Avg response" value="38s" delta="−6s vs last week" positive />
          </div>
        </main>

        {/* activity */}
        <aside className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Live activity
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-fern-500 pulse-dot" />
          </div>

          <div className="mt-4 space-y-2.5">
            {feed.map((f, i) => (
              <motion.div
                key={`${f.detail}-${i}`}
                initial={i === 0 ? { opacity: 0, y: -10, scale: 0.97 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.32 }}
                className="text-xs text-white/85 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: f.color }}
                  />
                  <span className="font-medium text-white text-[11px]">
                    {f.action}
                  </span>
                  <span className="text-white/40 text-[10px] ml-auto font-mono">
                    {f.timeAgo}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-white/65 leading-snug">
                  {f.detail}
                </div>
                <div className="text-[9px] text-white/35 mt-1 font-mono">
                  via {f.agent}
                </div>
              </motion.div>
            ))}
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

function NavItem({ label, active, badge }: { label: string; active?: boolean; badge?: string }) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
        active ? "bg-white/8 text-white" : "text-white/55 hover:text-white"
      }`}
    >
      <span>{label}</span>
      {badge && (
        <span className="text-[9px] font-mono bg-fern-700/40 text-fern-300 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

function AgentTile({
  a,
  count,
  delay,
  inView,
}: {
  a: typeof initialAgents[number];
  count: number;
  delay: number;
  inView: boolean;
}) {
  const dot =
    a.status === "active"
      ? "bg-fern-500 pulse-dot"
      : a.status === "drafting"
      ? "bg-[#C89B3C] pulse-dot-amber"
      : a.status === "scheduled"
      ? "bg-fern-400"
      : "bg-white/30";
  const statusLabel =
    a.status === "active"
      ? "Active"
      : a.status === "drafting"
      ? "Drafting"
      : a.status === "scheduled"
      ? "Scheduled"
      : "Idle";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/55">
            {statusLabel}
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/35">{a.countLabel}</span>
      </div>
      <div className="mt-2 text-xs font-medium text-white">{a.name}</div>
      <div className="mt-1 text-[11px] text-white/55 truncate">{a.last}</div>
      <div className="mt-2 text-base font-mono num-mono text-fern-300">
        {a.countText ?? count.toString()}
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="mt-1 text-xl font-medium text-white num-mono">{value}</div>
      <div className={`mt-0.5 text-[10px] ${positive ? "text-fern-400" : "text-white/55"}`}>
        {delta}
      </div>
    </div>
  );
}
