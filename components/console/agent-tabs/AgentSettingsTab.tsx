"use client";

import { useState, useTransition } from "react";

import { updateAgentSettings } from "@/app/console/agents/[id]/actions";
import type { AgentDetailData, AgentStatus } from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: AgentStatus; label: string; help: string }[] = [
  { value: "scoped",   label: "Scoped",   help: "We've agreed on what this agent does, but it isn't built yet." },
  { value: "in-build", label: "In build", help: "Being built. Not running yet." },
  { value: "live",     label: "Live",     help: "Running and handling real work." },
  { value: "paused",   label: "Paused",   help: "Temporarily stopped. Won't run on its schedule." },
  { value: "archived", label: "Archived", help: "Retired. Read-only history." },
];

export default function AgentSettingsTab({ data }: { data: AgentDetailData }) {
  const [name, setName] = useState(data.agent.name);
  const [description, setDescription] = useState(data.agent.description ?? "");
  const [status, setStatus] = useState<AgentStatus>(data.agent.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== data.agent.name ||
    description !== (data.agent.description ?? "") ||
    status !== data.agent.status;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateAgentSettings({
        agentId: data.agent.id,
        name,
        description,
        status,
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

      <div className="border-t border-white/8 pt-6">
        <h4 className="text-sm font-semibold text-white">Run cadence &amp; approval</h4>
        <p className="mt-1 text-xs text-white/55">
          Coming next. Cron schedule and approval-required toggle will live here.
        </p>
      </div>
    </div>
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
