"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/**
 * PLACEHOLDER REVIEWS — these are NOT real customers.
 * Used only for visual layout while pre-customer.
 * Replace with real testimonials once we have signed clients.
 */
const reviews = [
  {
    initials: "SK",
    color: "#7BB896",
    name: "Sarah K.",
    role: "Owner, local medical spa",
    location: "Seattle, WA",
    quote:
      "Used to lose after-hours bookings constantly. Woke up on day one to three new appointments that booked themselves overnight. Genuinely shocked.",
    featured: true,
  },
  {
    initials: "MT",
    color: "#A8C49A",
    name: "Marcus T.",
    role: "Practice manager",
    location: "Bellevue, WA",
    quote:
      "The Monday morning report is the best thing we've added to the practice in years. I know exactly where we stand before I get to the office.",
    featured: false,
  },
  {
    initials: "JM",
    color: "#3D7A55",
    name: "Jenna M.",
    role: "Founder, fitness studio",
    location: "Kirkland, WA",
    quote:
      "Responding to Google reviews used to take 30 minutes a week. Now it just happens. A client mentioned how fast we respond — I'd forgotten it was even running.",
    featured: false,
  },
];

export default function Reviews() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="reviews"
      ref={ref}
      className="bg-fern-100 pt-24 pb-28 px-6 md:px-10 border-t border-fern-300"
    >
      <div className="max-w-page mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fern-700">
              From the people running the businesses
            </p>
            <h2 className="mt-3 max-w-[18ch]">
              Quiet automations.<br />
              Real owner&rsquo;s words.
            </h2>
          </div>
          <p className="text-muted text-base leading-relaxed">
            Operators across the Pacific Northwest using Fern to take the
            repetitive work off their plate.
          </p>
        </div>

        {/* featured */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-2xl bg-fern-900 text-white overflow-hidden relative"
        >
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-fern-700/40 blur-[120px]" />
          </div>
          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 px-7 md:px-10 py-10 items-center">
            <div>
              <svg width="32" height="22" viewBox="0 0 32 22" className="mb-5 text-fern-500/70" fill="currentColor">
                <path d="M0 22V14C0 6.5 4 1.5 12 0V4C8 5.5 6 8.5 6 13H12V22H0ZM20 22V14C20 6.5 24 1.5 32 0V4C28 5.5 26 8.5 26 13H32V22H20Z" />
              </svg>
              <p className="text-xl md:text-2xl leading-snug font-medium tracking-tight max-w-[28ch]">
                {reviews[0].quote}
              </p>
            </div>
            <div className="flex items-center md:flex-col md:items-end gap-4">
              <Avatar initials={reviews[0].initials} color={reviews[0].color} size={56} />
              <div className="md:text-right">
                <div className="font-semibold text-white">{reviews[0].name}</div>
                <div className="text-xs text-white/55">{reviews[0].role}</div>
                <div className="text-[10px] font-mono text-white/40 mt-0.5">
                  {reviews[0].location}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* pair */}
        <div className="mt-5 grid md:grid-cols-2 gap-5">
          {reviews.slice(1).map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="bg-white border border-fern-300 rounded-2xl p-7"
            >
              <div className="flex items-center gap-3">
                <Avatar initials={r.initials} color={r.color} size={42} />
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted">{r.role}</div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-ink">
                {r.quote}
              </p>
              <div className="mt-5 text-[10px] font-mono uppercase tracking-wider text-fern-700">
                {r.location}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

function Avatar({ initials, color, size = 42 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.36,
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </div>
  );
}
