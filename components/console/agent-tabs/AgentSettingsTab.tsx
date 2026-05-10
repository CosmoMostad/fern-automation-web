"use client";

import { useState, useTransition } from "react";

import {
  updateAgentConfig,
  updateAgentSettings,
} from "@/app/console/agents/[id]/actions";
import { getManifest } from "@/lib/agents/manifest";
import type {
  AgentDetailData,
  AgentStatus,
  TrustMode,
} from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: AgentStatus; label: string; help: string }[] = [
  { value: "scoped",   label: "Scoped",   help: "We've agreed on what this agent does, but it isn't built yet." },
  { value: "in-build", label: "In build", help: "Being built. Not running yet." },
  { value: "live",     label: "Live",     help: "Running and handling real work." },
  { value: "paused",   label: "Paused",   help: "Temporarily stopped. Won't run on its schedule." },
  { value: "archived", label: "Archived", help: "Retired. Read-only history." },
];

const TRUST_OPTIONS: { value: TrustMode; label: string; help: string }[] = [
  {
    value: "manual",
    label: "Manual",
    help: "Every outbound is queued for human approval. Highest control. The default while you're learning what the agent gets right.",
  },
  {
    value: "assisted",
    label: "Assisted",
    help: "High-confidence drafts auto-send. Anything uncertain or off-script escalates to a human.",
  },
  {
    value: "autonomous",
    label: "Autonomous",
    help: "All drafts auto-send. The agent only escalates when something explicitly trips a guardrail.",
  },
];

export default function AgentSettingsTab({ data }: { data: AgentDetailData }) {
  const [name, setName] = useState(data.agent.name);
  const [description, setDescription] = useState(data.agent.description ?? "");
  const [status, setStatus] = useState<AgentStatus>(data.agent.status);
  const [trustMode, setTrustMode] = useState<TrustMode>(
    (data.agent.trust_mode as TrustMode) ?? "manual"
  );
  const initialApproval = (() => {
    const cfg = (data.agent.config ?? {}) as Record<string, unknown>;
    if (typeof cfg.approval_required === "boolean") return cfg.approval_required;
    return true;
  })();
  const [approvalRequired, setApprovalRequired] = useState<boolean>(
    initialApproval
  );

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== data.agent.name ||
    description !== (data.agent.description ?? "") ||
    status !== data.agent.status ||
    trustMode !== ((data.agent.trust_mode as TrustMode) ?? "manual") ||
    approvalRequired !== initialApproval;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateAgentSettings({
        agentId: data.agent.id,
        name,
        description,
        status,
        trust_mode: trustMode,
        approval_required: approvalRequired,
      });
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Field label="Name" hint="Shown across the Console and in escalation queues.">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
        />
      </Field>

      <Field
        label="Description"
        hint="One sentence — what this agent does. Helps teammates know which agent owns which queue."
      >
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
        />
      </Field>

      <Field
        label="Status"
        hint="Controls whether the agent runs on its schedule, and how it appears in dashboards."
      >
        <div className="space-y-1">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition ${
                  active
                    ? "bg-fern-700/15 border-fern-700/40"
                    : "bg-white/[0.02] border-white/8 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{opt.label}</span>
                  {active && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-fern-300">
                      selected
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-white/55">{opt.help}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Trust mode"
        hint="The progressive ladder. Start in Manual; promote when the agent has proven itself for the kind of message it sends."
      >
        <div className="space-y-1">
          {TRUST_OPTIONS.map((opt) => {
            const active = trustMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTrustMode(opt.value)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition ${
                  active
                    ? "bg-fern-700/15 border-fern-700/40"
                    : "bg-white/[0.02] border-white/8 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{opt.label}</span>
                  {active && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-fern-300">
                      selected
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-white/55">{opt.help}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Approval queue"
        hint="When on, every drafted message lands in the approval queue. When off, the agent's trust mode decides what auto-sends."
      >
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={approvalRequired}
            onChange={(e) => setApprovalRequired(e.target.checked)}
            className="mt-0.5 accent-fern-700"
          />
          <div>
            <div className="text-sm text-white">Require approval before sending</div>
            <div className="text-xs text-white/55 mt-0.5">
              Recommended on for the first few weeks of any new agent. Some
              agents (cold outreach to prospects) should keep this on
              indefinitely.
            </div>
          </div>
        </label>
      </Field>

      <div className="border-t border-white/8 pt-4 flex items-center gap-3">
        <button
          disabled={pending || !dirty}
          onClick={save}
          className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md transition"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved && !dirty && <span className="text-xs text-fern-300">Saved.</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      <RunSchedule data={data} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Run schedule — only for agents whose triggerKind is "inbound" (they poll
 * a Gmail inbox on a cadence). For other agent types this section is hidden.
 *
 * Two settings:
 *   - poll_query  : which emails to look at (Gmail search syntax)
 *   - max_per_run : cap on emails processed per run
 *
 * Presets cover ~95% of cases; "Custom" reveals a raw input for power users.
 * Inline-saves on each change so users get immediate feedback.
 * ───────────────────────────────────────────────────────────────────────── */

const QUERY_PRESETS: Array<{ value: string; label: string; help: string }> = [
  {
    value: "is:unread newer_than:1d",
    label: "Unread, last 24 hours",
    help: "Recommended. Catches new mail without re-reading old threads.",
  },
  {
    value: "is:unread newer_than:7d",
    label: "Unread, last 7 days",
    help: "Use when first turning the agent on, to catch up on a backlog.",
  },
  {
    value: "is:unread",
    label: "All unread, no time limit",
    help: "Aggressive. The agent will work through every unread message in the inbox.",
  },
];

function RunSchedule({ data }: { data: AgentDetailData }) {
  const agentType =
    typeof (data.agent.config as Record<string, unknown>)?.type === "string"
      ? ((data.agent.config as Record<string, unknown>).type as string)
      : null;
  const manifest = getManifest(agentType);
  if (!manifest || manifest.triggerKind !== "inbound") return null;

  const config = (data.agent.config ?? {}) as Record<string, unknown>;
  const initialPollQuery =
    typeof config.poll_query === "string" && config.poll_query.length > 0
      ? config.poll_query
      : QUERY_PRESETS[0].value;
  const initialMaxPerRun =
    typeof config.max_per_run === "number"
      ? config.max_per_run
      : typeof config.max_per_run === "string"
      ? parseInt(config.max_per_run, 10) || 20
      : 20;

  const presetMatch = QUERY_PRESETS.find((p) => p.value === initialPollQuery);
  const [pollQuery, setPollQuery] = useState(initialPollQuery);
  const [maxPerRun, setMaxPerRun] = useState(initialMaxPerRun);
  const [showCustom, setShowCustom] = useState(!presetMatch);
  const [pending, startTransition] = useTransition();
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function persist(path: string, value: unknown) {
    setError(null);
    setSavedPath(null);
    startTransition(async () => {
      const r = await updateAgentConfig({ agentId: data.agent.id, path, value });
      if (r.ok) {
        setSavedPath(path);
        setTimeout(() => setSavedPath((p) => (p === path ? null : p)), 1500);
      } else {
        setError(r.error);
      }
    });
  }

  function selectPreset(value: string) {
    setShowCustom(false);
    setPollQuery(value);
    persist("poll_query", value);
  }

  function selectCustom() {
    setShowCustom(true);
  }

  function saveCustom() {
    persist("poll_query", pollQuery);
  }

  function saveMaxPerRun(n: number) {
    setMaxPerRun(n);
    persist("max_per_run", n);
  }

  return (
    <section className="border-t border-white/8 pt-6 mt-2 space-y-5">
      <header>
        <h2 className="text-base font-semibold text-white">Run schedule</h2>
        <p className="mt-1 text-xs text-white/55">
          When this agent runs, it picks up emails matching the filter below.
          The schedule itself (how often it checks) is set by Fern when the
          agent is provisioned.
        </p>
      </header>

      <Field
        label="What emails to watch"
        hint="Pick a preset, or write a custom Gmail search query if you need something specific."
      >
        <div className="space-y-1.5">
          {QUERY_PRESETS.map((p) => {
            const active = !showCustom && pollQuery === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPreset(p.value)}
                disabled={pending}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition ${
                  active
                    ? "bg-fern-700/15 border-fern-700/40"
                    : "bg-white/[0.02] border-white/8 hover:border-white/20"
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{p.label}</span>
                  {active && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-fern-300">
                      selected
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-white/55">{p.help}</div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={selectCustom}
            disabled={pending}
            className={`w-full text-left px-3 py-2.5 rounded-md border transition ${
              showCustom
                ? "bg-fern-700/15 border-fern-700/40"
                : "bg-white/[0.02] border-white/8 hover:border-white/20"
            } disabled:opacity-50`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">
                Custom Gmail query{" "}
                <span className="text-white/45 font-normal">(advanced)</span>
              </span>
              {showCustom && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-fern-300">
                  selected
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-white/55">
              Use any Gmail search syntax — e.g. <code className="text-white/75">label:vip is:unread</code>.
            </div>
          </button>

          {showCustom && (
            <div className="pt-2 flex items-center gap-2">
              <input
                value={pollQuery}
                onChange={(e) => setPollQuery(e.target.value)}
                placeholder="is:unread newer_than:1d"
                className="flex-1 bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white font-mono placeholder:text-white/30 focus:border-fern-500 outline-none"
              />
              <button
                type="button"
                onClick={saveCustom}
                disabled={pending || pollQuery.trim().length === 0}
                className="text-xs bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          )}

          {savedPath === "poll_query" && (
            <div className="text-xs text-fern-300">Saved.</div>
          )}
        </div>
      </Field>

      <Field
        label="Max emails per run"
        hint="Hard cap so a sudden flood of mail doesn't overwhelm the agent."
      >
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={200}
            value={maxPerRun}
            onChange={(e) =>
              saveMaxPerRun(parseInt(e.target.value, 10) || 20)
            }
            className="w-24 bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:border-fern-500 outline-none"
          />
          {savedPath === "max_per_run" && (
            <span className="text-xs text-fern-300">Saved.</span>
          )}
        </div>
      </Field>

      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-white">{label}</div>
      {hint && <div className="text-[11px] text-white/45 mt-0.5">{hint}</div>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
