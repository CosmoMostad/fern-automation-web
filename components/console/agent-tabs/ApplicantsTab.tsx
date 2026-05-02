"use client";

import Link from "next/link";

import type { AgentDetailData, Thread } from "@/lib/supabase/types";

/**
 * Applicants tab — for enrollment_funnel agents.
 *
 * Treats each thread as one applicant (since each family writes from
 * one email address into the program inbox). Groups them by funnel
 * stage inferred from the thread's most recent message status. As the
 * data model grows we can promote stage to a proper column on threads
 * or a dedicated applicants table.
 */

type Stage =
  | "new_inquiry"
  | "scheduling"
  | "evaluating"
  | "decision"
  | "enrolled"
  | "passed";

const STAGES: { id: Stage; label: string; help: string }[] = [
  { id: "new_inquiry", label: "New inquiries", help: "First contact, awaiting our reply" },
  { id: "scheduling", label: "Scheduling", help: "Picking an evaluation slot" },
  { id: "evaluating", label: "Evaluating", help: "In or just finished an eval class" },
  { id: "decision", label: "Decision", help: "Coach has rendered a decision" },
  { id: "enrolled", label: "Enrolled", help: "Paperwork done — they're in" },
  { id: "passed", label: "Passed", help: "Closed without enrollment" },
];

export default function ApplicantsTab({ data }: { data: AgentDetailData }) {
  const threads = data.recent_threads;

  // Naive stage inference until we have a dedicated column.
  // Status='escalated' or 'closed' → terminal stages.
  const groupings = new Map<Stage, Thread[]>();
  for (const s of STAGES) groupings.set(s.id, []);
  for (const t of threads) {
    const stage = inferStage(t);
    groupings.get(stage)?.push(t);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {STAGES.map((s) => {
          const count = groupings.get(s.id)?.length ?? 0;
          return (
            <div
              key={s.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="text-xs font-medium text-white/75">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-12 px-6 text-center">
          <div className="text-sm font-medium text-white">
            No applicants yet.
          </div>
          <p className="mt-1.5 text-sm text-white/65 max-w-md mx-auto">
            When a family sends an inquiry, the agent extracts the kid&rsquo;s
            signals (age, ratings, schooling), applies your routing rules,
            and drafts a welcome reply. Each family appears here as a card.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {STAGES.map((s) => {
            const items = groupings.get(s.id) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={s.id}>
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-white/85">
                    {s.label}
                  </h3>
                  <span className="text-xs text-white/45">{s.help}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((t) => (
                    <ApplicantCard
                      key={t.id}
                      thread={t}
                      messages={data.recent_messages}
                      agentId={data.agent.id}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function inferStage(t: Thread): Stage {
  if (t.status === "closed") return "enrolled";
  if (t.status === "escalated") return "decision";
  // Heuristic: brand-new threads → new_inquiry; multi-message → scheduling;
  // long-running → evaluating. Refines once we have stage data.
  if (t.message_count <= 1) return "new_inquiry";
  if (t.message_count <= 3) return "scheduling";
  return "evaluating";
}

function ApplicantCard({
  thread,
  messages,
  agentId,
}: {
  thread: Thread;
  messages: AgentDetailData["recent_messages"];
  agentId: string;
}) {
  const threadMsgs = messages
    .filter((m) => m.thread_id === thread.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const latest = threadMsgs[0];
  return (
    <Link
      href={`/console/agents/${agentId}?tab=timeline`}
      className="plain block rounded-lg border border-white/10 bg-white/[0.025] hover:border-white/20 transition p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {thread.contact_name || thread.contact_email || "(unknown family)"}
          </div>
          <div className="mt-0.5 text-xs text-white/55 truncate">
            {thread.subject ?? "(no subject)"}
          </div>
        </div>
        <span className="text-xs text-white/45 font-mono whitespace-nowrap">
          {thread.message_count} msg
        </span>
      </div>
      {latest?.body_preview && (
        <div className="mt-2 text-sm text-white/65 leading-relaxed line-clamp-2">
          {latest.body_preview}
        </div>
      )}
      <div className="mt-3 text-xs text-white/45">
        Last: {timeAgo(thread.last_message_at)}
      </div>
    </Link>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
