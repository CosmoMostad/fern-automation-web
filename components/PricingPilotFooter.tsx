"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DemoButton } from "./DemoProvider";

/* ──────────────────────────────────────────────
   PRICING — clean cards on white
   ────────────────────────────────────────────── */

export function Pricing() {
  return (
    <section id="pricing" className="bg-white pt-24 pb-28 px-6 md:px-10">
      <div className="max-w-page mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fern-700">
            Pricing
          </p>
          <h2 className="mt-3">Honest ranges. Real numbers in the proposal.</h2>
          <p className="mt-4 text-muted text-base leading-relaxed">
            Pricing is still settling — Fern is early and projects are scoped
            one at a time. Here&rsquo;s the ballpark.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <PricingCard
            label="Build"
            range="$5,000 – $12,000"
            unit="one-time per agent"
            features={[
              "Discovery + scoping",
              "Voice profile built from your past writing",
              "Custom dashboard scoped to your business",
              "1 to 3 weeks from kickoff to live",
              "Quiet rollout — every action through you first",
            ]}
          />
          <PricingCard
            label="Run"
            range="$400 – $1,200"
            unit="per month"
            highlight
            features={[
              "Hosting + model usage included",
              "Changes as your business changes",
              "Weekly health check, monthly review",
              "Cancel anytime, no annual contract",
              "Console access for your whole team",
            ]}
          />
        </div>

        <p className="mt-8 text-xs text-muted text-center max-w-prose mx-auto">
          The actual number lives in a written proposal after we&rsquo;ve
          talked. No retainers, no surprise line items, no per-seat trickery.
        </p>
      </div>
    </section>
  );
}

function PricingCard({
  label,
  range,
  unit,
  features,
  highlight,
}: {
  label: string;
  range: string;
  unit: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-8 ${
        highlight
          ? "bg-fern-900 text-white"
          : "bg-white border border-rule"
      }`}
    >
      <div
        className={`text-[10px] font-mono uppercase tracking-[0.18em] ${
          highlight ? "text-fern-300" : "text-fern-700"
        }`}
      >
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">{range}</span>
      </div>
      <div
        className={`mt-1 text-sm ${highlight ? "text-white/80" : "text-muted"}`}
      >
        {unit}
      </div>
      <hr
        className={`my-5 ${highlight ? "border-white/10" : "border-rule"}`}
      />
      <ul className="space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <svg
              className="mt-1 flex-shrink-0"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 6.5L4.8 9L10 3.5"
                stroke={highlight ? "#7BB896" : "#2D5A3D"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={highlight ? "text-white/85" : "text-ink"}>
              {f}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──────────────────────────────────────────────
   CURRENTLY BUILDING (WSC pilot status)
   ────────────────────────────────────────────── */

export function CurrentlyBuilding() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const agents = [
    { name: "Intake & booking", state: "in-build" as const },
    { name: "No-show prevention", state: "in-build" as const },
    { name: "Feedback collection", state: "scoped" as const },
    { name: "Member outreach", state: "scoped" as const },
    { name: "Internal staff Slack", state: "scoped" as const },
    { name: "Weekly owner report", state: "scoped" as const },
  ];

  return (
    <section
      id="work"
      ref={ref}
      className="bg-fern-200 pt-24 pb-28 px-6 md:px-10 border-t border-fern-300"
    >
      <div className="max-w-page mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fern-700">
              Currently building
            </p>
            <h2 className="mt-3 max-w-[20ch]">
              Fern&rsquo;s first pilot is live.
            </h2>
          </div>
          <p className="text-muted text-base leading-relaxed">
            Notes from the build go up as I ship. Agents are free during the
            pilot — the infrastructure work is paid.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-12 bg-white border border-fern-300 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="px-7 py-5 border-b border-fern-300 bg-fern-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-fern-600 pulse-dot" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-fern-700">
                Pilot in progress
              </span>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-fern-700">
              April 2026 → July 2026
            </span>
          </div>

          <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 px-7 py-7">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                Pilot client
              </p>
              <h3 className="mt-1 text-xl">Sports club · Woodinville, WA</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted max-w-prose">
                Six small agents covering intake, booking, no-show prevention,
                feedback, internal Slack, and a weekly owner report. Building
                the agents proactively while the contract finalizes — they
                ship the day the team says go.
              </p>
              <Link
                href="/notes"
                className="mt-5 inline-block text-sm font-medium text-fern-800 hover:text-fern-900"
              >
                Read build notes →
              </Link>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                Agents in scope
              </p>
              <ul className="mt-3 space-y-1.5">
                {agents.map((a) => (
                  <li
                    key={a.name}
                    className="flex items-center justify-between text-sm py-1.5"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          a.state === "in-build"
                            ? "bg-fern-600 pulse-dot"
                            : "bg-fern-300"
                        }`}
                      />
                      <span>{a.name}</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                      {a.state === "in-build" ? "in build" : "scoped"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-rule text-xs text-muted">
                <span className="font-mono">2 of 6 in build · 0 live</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   CLOSING CTA — dark band
   ────────────────────────────────────────────── */

export function ClosingCTA() {
  return (
    <section className="hero-night px-6 md:px-10 py-24 md:py-32 text-white text-center relative overflow-hidden">
      <div className="max-w-2xl mx-auto relative-z">
        <h2 className="text-white">
          The repetitive work doesn&rsquo;t need a person.
        </h2>
        <p className="mt-5 text-white/70 text-base leading-relaxed max-w-[52ch] mx-auto">
          Send a note. I&rsquo;ll read it, ask a couple of questions, and tell
          you honestly whether an agent is the right answer for the work
          you&rsquo;re trying to take off your plate.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <DemoButton variant="fern">Get a demo →</DemoButton>
          <a
            href="mailto:cosmo@fernautomation.com"
            className="btn-ghost-light"
          >
            Or just email me
          </a>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   FOOTER — dark
   ────────────────────────────────────────────── */

export function SiteFooter() {
  return (
    <footer className="bg-[#06090A] border-t border-white/8 text-white/80 px-6 md:px-10 py-12">
      <div className="max-w-page mx-auto">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2">
              <svg width="18" height="22" viewBox="0 0 22 26" aria-hidden>
                <path d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z" fill="#7BB896" />
                <path d="M11 8C11 8 11 14 14 17" stroke="#A8C49A" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-white font-medium tracking-tight">fern automation</span>
            </div>
            <p className="mt-4 text-sm text-white/80 max-w-xs leading-relaxed">
              A one-person company in Seattle. Building small AI agents that
              handle the repetitive work between a small business&rsquo;s
              tools.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">
              Site
            </div>
            <ul className="space-y-2 text-sm">
              <li><a href="#agents" className="plain hover:text-white">Agents</a></li>
              <li><a href="#console" className="plain hover:text-white">Console</a></li>
              <li><a href="#how-it-works" className="plain hover:text-white">How it works</a></li>
              <li><Link href="/notes" className="plain hover:text-white">Notes</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">
              Company
            </div>
            <ul className="space-y-2 text-sm">
              <li><a href="#reviews" className="plain hover:text-white">From operators</a></li>
              <li><a href="mailto:cosmo@fernautomation.com" className="plain hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">
              Get in touch
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:cosmo@fernautomation.com" className="plain hover:text-white break-all">
                  cosmo@fernautomation.com
                </a>
              </li>
              <li>
                <a
                  href="https://calendly.com/cosmo-fernautomation/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plain hover:text-white"
                >
                  Book 30 min →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col md:flex-row md:justify-between gap-3 text-sm text-white/70">
          <span>© 2026 Fern Automation · Seattle, WA</span>
          <span>Built in Seattle · Hosted in Oregon</span>
        </div>
      </div>
    </footer>
  );
}
