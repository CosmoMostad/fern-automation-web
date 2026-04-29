"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    n: "01",
    title: "A 30-minute call",
    body: "Show me the part of the day that's annoying. I'll tell you whether an agent is the right answer for it.",
    cap: "Free · this week",
  },
  {
    n: "02",
    title: "A scoped proposal",
    body: "What I'd build, what it connects to, what it costs to build, what it costs to run. No retainer, no surprise lines.",
    cap: "2 – 3 days",
  },
  {
    n: "03",
    title: "Build & quiet rollout",
    body: "Runs in draft mode first. Every action goes through you for approval until you're comfortable letting it run on its own.",
    cap: "1 – 3 weeks",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="how-it-works" ref={ref} className="bg-white pt-24 pb-28 px-6 md:px-10">
      <div className="max-w-page mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
          <div>
            <p className="text-sm font-medium text-fern-700">
              How it works
            </p>
            <h2 className="mt-3 max-w-[20ch]">
              From a single call to a working agent in under a month.
            </h2>
          </div>
          <p className="text-muted text-base leading-relaxed">
            No big retainer, no SaaS contract. Each engagement is one agent at
            a time. Add more once the first one is earning its keep.
          </p>
        </div>

        <div className="mt-16 relative">
          {/* connecting line */}
          <div
            aria-hidden
            className="hidden md:block absolute top-6 left-[8%] right-[8%] h-px bg-fern-300"
          />
          <ol className="grid md:grid-cols-3 gap-10 md:gap-6 list-none p-0">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative md:text-center"
              >
                <div className="flex md:justify-center mb-5">
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white flex items-center justify-center text-sm font-mono font-medium text-fern-800 ring-1 ring-fern-300 shadow-sm">
                    {s.n}
                  </div>
                </div>
                <h3 className="text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed md:mx-auto md:max-w-[26ch]">
                  {s.body}
                </p>
                <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-fern-700">
                  {s.cap}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
