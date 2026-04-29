"use client";

import { motion } from "framer-motion";
import { DemoButton } from "./DemoProvider";

export default function MarketingHero() {
  return (
    <section className="hero-night pt-32 md:pt-40 pb-16 md:pb-24 px-6 md:px-10 text-white">
      <div className="max-w-page mx-auto relative-z">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-center mx-auto max-w-[14ch] md:max-w-[18ch]"
          style={{ color: "#fff" }}
        >
          Custom automated workflows{" "}
          <span style={{ color: "#A8C49A" }}>for your business.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-center mx-auto max-w-[52ch] mt-6 text-lg leading-relaxed text-white/70"
        >
          Fern builds small AI agents that quietly handle the repetitive work
          between your tools — replies, bookings, reviews, reports — built for
          your business and running by next month.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-8 flex items-center justify-center gap-3 flex-wrap"
        >
          <DemoButton variant="fern">Get a demo →</DemoButton>
          <a href="#agents" className="btn-ghost-light">
            See it work
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 md:mt-20"
        >
          <AgentFlowDiagram />
        </motion.div>
      </div>
    </section>
  );
}

const incoming = [
  { kind: "Email", text: "New website inquiry", color: "#7BB896" },
  { kind: "SMS", text: "Booking question", color: "#A8C49A" },
  { kind: "Review", text: "5★ on Google", color: "#C89B3C" },
  { kind: "Email", text: "Pricing question", color: "#7BB896" },
  { kind: "SMS", text: "Reschedule request", color: "#A8C49A" },
  { kind: "Form", text: "Demo request", color: "#7BB896" },
];

const outgoing = [
  { kind: "Reply", text: "Drafted in your tone", color: "#7BB896" },
  { kind: "Booked", text: "Thursday 2:00pm", color: "#A8C49A" },
  { kind: "Reply", text: "Posted to Google", color: "#C89B3C" },
  { kind: "Reply", text: "Sent in 42 seconds", color: "#7BB896" },
  { kind: "Booked", text: "Moved to Friday 10am", color: "#A8C49A" },
  { kind: "Reply", text: "Routed to Cosmo", color: "#7BB896" },
];

function AgentFlowDiagram() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-[rgba(10,19,16,0.6)] backdrop-blur-sm overflow-hidden">
      <div className="px-5 md:px-7 py-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fern-500 pulse-dot" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/55">
            Live · agent in operation
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
          fern · live demo
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] md:grid-cols-[1fr_180px_1fr] items-stretch h-[340px] md:h-[380px]">
        <FlowColumn title="Incoming" align="right" items={incoming} reverse={false} />

        <div className="relative flex items-center justify-center px-2 md:px-4 border-l border-r border-white/8">
          <FernHub />
          <ConnectorLeft />
          <ConnectorRight />
        </div>

        <FlowColumn title="Outgoing" align="left" items={outgoing} reverse={true} />
      </div>

      <div className="px-5 md:px-7 py-3 border-t border-white/8 flex items-center justify-between text-[11px] text-white/40 font-mono">
        <span>Illustration. Real volumes come from your business.</span>
        <span className="hidden md:inline">~6 / hr · 0 errors</span>
      </div>
    </div>
  );
}

function FernHub() {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 -m-3 rounded-full bg-fern-700/30 blur-xl" />
        <div className="absolute inset-0 -m-1 rounded-full bg-fern-700/20 blur-md slow-spin" />
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-fern-500/60 bg-[#0F1A15] flex items-center justify-center">
          <svg width="32" height="38" viewBox="0 0 22 26" aria-hidden>
            <path d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z" fill="#7BB896" />
            <path d="M11 8C11 8 11 14 14 17" stroke="#1C3D2A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-xs font-medium text-white">Fern</div>
        <div className="text-[10px] text-white/45 font-mono uppercase tracking-wider">
          Reads · Drafts · Acts
        </div>
      </div>
    </div>
  );
}

function ConnectorLeft() {
  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-fern-700/50 to-fern-500/70" />
  );
}
function ConnectorRight() {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-px bg-gradient-to-r from-fern-500/70 via-fern-700/50 to-transparent" />
  );
}

type FlowItem = { kind: string; text: string; color: string };

function FlowColumn({
  title,
  align,
  items,
  reverse,
}: {
  title: string;
  align: "left" | "right";
  items: FlowItem[];
  reverse: boolean;
}) {
  const loop = [...items, ...items];
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute top-3 left-0 right-0 px-5 md:px-7 z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
          {title}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[rgba(10,19,16,0.95)] to-transparent z-[5]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[rgba(10,19,16,0.95)] to-transparent z-[5]" />

      <motion.div
        className="absolute inset-0 px-5 md:px-7 pt-12 pb-4 flex flex-col gap-3"
        animate={{ y: reverse ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: 26, ease: "linear", repeat: Infinity }}
      >
        {loop.map((item, i) => (
          <FlowTile key={i} item={item} align={align} />
        ))}
      </motion.div>
    </div>
  );
}

function FlowTile({ item, align }: { item: FlowItem; align: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 max-w-[220px] w-full">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/45">
            {item.kind}
          </span>
        </div>
        <div className="mt-1 text-xs text-white/85 leading-snug">{item.text}</div>
      </div>
    </div>
  );
}
