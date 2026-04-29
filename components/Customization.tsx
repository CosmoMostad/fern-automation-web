"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Customization() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section
      ref={ref}
      className="relative bg-[#06090A] text-white pt-24 pb-28 px-6 md:px-10 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 80% 20%, rgba(82,147,107,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 10% 80%, rgba(45,90,61,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="max-w-page mx-auto relative-z">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium text-fern-500">
            Customization
          </p>
          <h2 className="mt-3 text-white">
            Built for your business — not someone else&rsquo;s CRM.
          </h2>
          <p className="mt-5 text-white/65 leading-relaxed max-w-[60ch] mx-auto">
            Most automation tools are giant SaaS apps that you bend your
            business to fit. Fern goes the other way: I read how you actually
            work, then build small agents that fit into the gaps without
            asking you to change anything.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/10 p-7 bg-white/[0.02]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/72">
                Off-the-shelf SaaS
              </span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <Bad>One-size-fits-all dashboard</Bad>
              <Bad>You log in to it every day</Bad>
              <Bad>Generic AI tone, doesn&rsquo;t sound like you</Bad>
              <Bad>$300+/mo per seat, locked into the platform</Bad>
              <Bad>Workflows you have to bend your business around</Bad>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border-2 border-fern-700 p-7 bg-fern-900/40 relative"
          >
            <div className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-wider text-fern-300 px-2 py-0.5 rounded bg-fern-700/40">
              Fern
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-fern-500 pulse-dot" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-fern-300">
                Built for your business
              </span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-white/85">
              <Good>Console scoped to your business</Good>
              <Good>Runs in the background — you only check in when you want</Good>
              <Good>Trained on your past replies, sounds like you</Good>
              <Good>Flat per-agent build, transparent monthly run cost</Good>
              <Good>Built around your existing tools and routines</Good>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Bad({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-1.5 w-3 h-px bg-white/30 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function Good({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className="mt-0.5 flex-shrink-0"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <circle cx="7" cy="7" r="6.5" fill="rgba(123,184,150,0.2)" stroke="#7BB896" />
        <path
          d="M4 7l2 2 4-4"
          stroke="#7BB896"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </li>
  );
}
