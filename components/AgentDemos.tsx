"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function AgentDemos() {
  return (
    <section
      id="agents"
      className="bg-white pt-24 pb-28 px-6 md:px-10"
    >
      <div className="max-w-page mx-auto">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-16 items-end">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fern-700">
              Agents
            </p>
            <h2 className="mt-3 max-w-[20ch]">
              Automate the work between your tools.
            </h2>
          </div>
          <p className="text-muted text-base leading-relaxed">
            Each agent is small, scoped, and built for one job in your
            business. Here are three of the most common.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <AgentCard
            kind="Email responder"
            tag="01"
            description="Replies to inbound questions in your tone, in under a minute, using what they actually asked."
          >
            <EmailResponderDemo />
          </AgentCard>

          <AgentCard
            kind="Booking & scheduling"
            tag="02"
            description="Customers text or chat to book. The agent finds slots, confirms, sends reminders, prevents no-shows."
          >
            <BookingDemo />
          </AgentCard>

          <AgentCard
            kind="Review responder"
            tag="03"
            description="Watches your Google Business profile and drafts a reply in your tone for every new review."
          >
            <ReviewDemo />
          </AgentCard>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   CARD CHROME
   ────────────────────────────────────────────── */

function AgentCard({
  kind,
  tag,
  description,
  children,
}: {
  kind: string;
  tag: string;
  description: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-rule overflow-hidden bg-white flex flex-col"
    >
      <div className="bg-[#0F1A15] text-white relative overflow-hidden h-[260px]">
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-fern-500">
            {tag}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
            {kind}
          </span>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[160px] bg-fern-700/15 blur-[80px] pointer-events-none" />
        <div className="relative z-[1] h-full flex items-center justify-center p-5 pt-10">
          {children}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold">{kind}</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   DEMO 1 · Email responder
   ────────────────────────────────────────────── */

const emailScenarios = [
  {
    inbox: { from: "jenna@coopersgolf.com", subject: "Pricing question", body: "Hi — what's your weekend rate?" },
    out: { sub: "drafted", text: "Hi Jenna, weekend rates are $85 …", time: "42s" },
  },
  {
    inbox: { from: "marcus@northwest.co", subject: "Tee time?", body: "Got anything Saturday afternoon?" },
    out: { sub: "drafted", text: "Hey Marcus, Saturday 2:30 …", time: "31s" },
  },
  {
    inbox: { from: "priya@example.com", subject: "Lessons", body: "Do you offer beginner lessons?" },
    out: { sub: "drafted", text: "Hi Priya — yes, our pro Tom …", time: "58s" },
  },
];

function EmailResponderDemo() {
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= 3) {
          setScenario((c) => (c + 1) % emailScenarios.length);
          return 0;
        }
        return s + 1;
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const s = emailScenarios[scenario];

  return (
    <div className="w-full max-w-[280px] flex flex-col gap-2.5">
      {/* incoming */}
      <motion.div
        key={`in-${scenario}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: step >= 0 ? 1 : 0, x: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/[0.05] border border-white/10 rounded-lg p-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-fern-700/30 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <rect x="0.5" y="0.5" width="9" height="7" rx="0.5" stroke="#A8C49A" />
              <path d="M1 1.5L5 4.5L9 1.5" stroke="#A8C49A" strokeWidth="0.8" />
            </svg>
          </div>
          <span className="text-[10px] text-white/55 font-mono truncate">{s.inbox.from}</span>
        </div>
        <div className="mt-1.5 text-[11px] font-medium text-white">{s.inbox.subject}</div>
        <div className="text-[10px] text-white/55 truncate">{s.inbox.body}</div>
      </motion.div>

      {/* processing */}
      <motion.div
        animate={{
          opacity: step >= 1 && step < 3 ? 1 : 0.25,
        }}
        className="flex items-center gap-2 text-[10px] font-mono text-white/55 px-2"
      >
        <span className="flex gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${step === 1 || step === 2 ? "bg-fern-500" : "bg-white/20"} transition`} />
          <span className={`w-1.5 h-1.5 rounded-full ${step >= 2 ? "bg-fern-500" : "bg-white/20"} transition`} style={{ transitionDelay: "120ms" }} />
          <span className={`w-1.5 h-1.5 rounded-full ${step >= 3 ? "bg-fern-500" : "bg-white/20"} transition`} style={{ transitionDelay: "240ms" }} />
        </span>
        <span>fern is drafting…</span>
      </motion.div>

      {/* outgoing */}
      <motion.div
        key={`out-${scenario}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: step >= 3 ? 1 : 0, x: step >= 3 ? 0 : 20 }}
        transition={{ duration: 0.35 }}
        className="bg-fern-700/15 border border-fern-700/40 rounded-lg p-2.5 self-end max-w-[88%]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-fern-300">
            {s.out.sub}
          </span>
          <span className="text-[10px] font-mono text-white/45">{s.out.time}</span>
        </div>
        <div className="mt-1 text-[11px] text-white">{s.out.text}</div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   DEMO 2 · Booking calendar
   ────────────────────────────────────────────── */

const bookingDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const bookingSchedule = [
  { day: 0, slot: 1, name: "Sarah K." },
  { day: 1, slot: 2, name: "Marcus L." },
  { day: 1, slot: 3, name: "Tom B." },
  { day: 2, slot: 0, name: "Jenna T." },
  { day: 3, slot: 2, name: "Priya N." },
  { day: 3, slot: 4, name: "David M." },
  { day: 4, slot: 1, name: "Amy R." },
  { day: 4, slot: 3, name: "Kevin J." },
  { day: 5, slot: 2, name: "Lisa M." },
];

function BookingDemo() {
  const [filledCount, setFilledCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFilledCount((c) => (c + 1) % (bookingSchedule.length + 4));
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full max-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/55">
          Apr 28 – May 4
        </span>
        <span className="text-[10px] font-mono text-fern-500">
          {Math.min(filledCount, bookingSchedule.length)} booked
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {bookingDays.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono text-white/45">
            {d}
          </div>
        ))}
        {Array.from({ length: 5 }).map((_, slotIdx) =>
          bookingDays.map((_, dayIdx) => {
            const booking = bookingSchedule.find(
              (b, i) => b.day === dayIdx && b.slot === slotIdx && i < filledCount
            );
            const filled = !!booking;
            return (
              <motion.div
                key={`${dayIdx}-${slotIdx}`}
                initial={false}
                animate={{
                  backgroundColor: filled
                    ? "rgba(82,147,107,0.35)"
                    : "rgba(255,255,255,0.04)",
                  borderColor: filled
                    ? "rgba(123,184,150,0.55)"
                    : "rgba(255,255,255,0.08)",
                }}
                transition={{ duration: 0.35 }}
                className="aspect-square rounded border flex items-center justify-center"
              >
                {filled && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[8px] font-mono text-fern-300"
                  >
                    {booking?.name.split(" ")[0].slice(0, 3)}
                  </motion.span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
      <div className="mt-3 px-2.5 py-2 rounded-md bg-white/[0.04] border border-white/8 text-[10px] text-white/65">
        <span className="font-medium text-white">SMS:</span> &ldquo;Confirmed
        Thursday at 2:00pm. Reply STOP to cancel.&rdquo;
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   DEMO 3 · Review responder (typewriter)
   ────────────────────────────────────────────── */

const reviewScenarios = [
  {
    name: "James T.",
    stars: 5,
    review: "Course was in great shape last Saturday. Best round I've had this year.",
    reply: "Thanks James, glad to hear it. Our grounds crew has been putting in extra hours this season. See you out there.",
  },
  {
    name: "Rachel K.",
    stars: 1,
    review: "Waited 45 minutes on the 7th hole. Nobody seemed to care.",
    reply: "Rachel, that's a fair complaint and we're sorry. 45 minutes is too long. Reach out and we'll make it right.",
  },
  {
    name: "David M.",
    stars: 4,
    review: "Beautiful course, great views. Greens were a little slow but the food at the turn made up for it.",
    reply: "Thanks David. You're right about the greens — they're on our list this week. Glad the food held up.",
  },
];

function ReviewDemo() {
  const [scenario, setScenario] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"showing" | "typing" | "done">("showing");

  useEffect(() => {
    const r = reviewScenarios[scenario];

    setTyped("");
    setPhase("showing");

    const showTimer = setTimeout(() => setPhase("typing"), 1100);
    return () => clearTimeout(showTimer);
  }, [scenario]);

  useEffect(() => {
    if (phase !== "typing") return;
    const r = reviewScenarios[scenario];
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i > r.reply.length) {
        clearInterval(id);
        setPhase("done");
        setTimeout(() => setScenario((s) => (s + 1) % reviewScenarios.length), 1700);
      } else {
        setTyped(r.reply.slice(0, i));
      }
    }, 22);
    return () => clearInterval(id);
  }, [phase, scenario]);

  const r = reviewScenarios[scenario];

  return (
    <div className="w-full max-w-[280px] flex flex-col gap-2.5">
      <motion.div
        key={`rev-${scenario}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/[0.04] border border-white/10 rounded-lg p-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white font-medium">{r.name}</span>
          <span className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < r.stars ? "bg-[#C89B3C]" : "bg-white/15"
                }`}
              />
            ))}
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-white/65 leading-snug">
          &ldquo;{r.review}&rdquo;
        </div>
      </motion.div>

      <div className="flex items-center gap-2 text-[10px] font-mono text-white/55 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-fern-500 pulse-dot" />
        <span>fern · drafting in your tone</span>
      </div>

      <div className="bg-fern-700/15 border border-fern-700/40 rounded-lg p-3 min-h-[88px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-fern-300">
            Draft reply
          </span>
          {phase === "done" && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-mono text-fern-500"
            >
              ready ✓
            </motion.span>
          )}
        </div>
        <div className="mt-1.5 text-[11px] text-white leading-snug">
          {typed}
          {phase === "typing" && (
            <span className="typewriter-caret inline-block w-1.5 h-3 bg-fern-500 ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
