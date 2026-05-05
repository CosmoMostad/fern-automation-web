"use client";

import { useState, useTransition } from "react";

import { updateAgentConfig } from "@/app/console/agents/[id]/actions";
import { getManifest } from "@/lib/agents/manifest";
import type {
  ConnectionField,
  ConnectionSection,
} from "@/lib/agents/manifest";
import type { AgentDetailData } from "@/lib/supabase/types";

/**
 * Connections tab — universal across agent types. Lets the business
 * self-serve their integrations without messaging Fern: Gmail OAuth,
 * API keys, source URL lists, etc.
 *
 * Sections are driven by the agent's manifest (lib/agents/manifest.ts)
 * so each agent type shows only the connections it actually needs.
 * Same agent type across different businesses gets the same fields —
 * interface is locked to the agent.
 */

const EMPTY_FALLBACK: ConnectionSection[] = [
  {
    title: "Connections",
    description: "This agent type doesn't have configurable connections yet.",
    fields: [],
  },
];

export default function ConnectionsTab({ data }: { data: AgentDetailData }) {
  const agentType =
    typeof (data.agent.config as Record<string, unknown>)?.type === "string"
      ? ((data.agent.config as Record<string, unknown>).type as string)
      : null;
  const manifest = getManifest(agentType);
  const sections: ConnectionSection[] = manifest?.connections ?? EMPTY_FALLBACK;

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <p className="text-sm text-white/75 leading-relaxed">
          Connections this agent uses to do its work. Edit them here when
          something changes — a new email account, a fresh API key, a
          different source URL — and the agent picks up your edits on its
          next run. No need to reach out to Fern.
        </p>
      </header>

      {sections.map((section, i) => (
        <Section
          key={i}
          section={section}
          agentId={data.agent.id}
          config={data.agent.config as Record<string, unknown>}
        />
      ))}
    </div>
  );
}

function Section({
  section,
  agentId,
  config,
}: {
  section: ConnectionSection;
  agentId: string;
  config: Record<string, unknown>;
}) {
  return (
    <section className="border border-white/10 bg-white/[0.02] rounded-xl p-6">
      <h2 className="text-base font-semibold text-white">{section.title}</h2>
      {section.description && (
        <p className="mt-1 text-sm text-white/70 leading-relaxed">
          {section.description}
        </p>
      )}

      {section.fields.length > 0 ? (
        <div className="mt-5 space-y-5">
          {section.fields.map((field) => (
            <Field
              key={field.path}
              field={field}
              agentId={agentId}
              initialValue={getPath(config, field.path)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/55 italic">
          No editable fields for this section yet.
        </p>
      )}
    </section>
  );
}

function Field({
  field,
  agentId,
  initialValue,
}: {
  field: ConnectionField;
  agentId: string;
  initialValue: unknown;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coerce stored value to the right control format
  const initialString =
    field.kind === "url_list"
      ? Array.isArray(initialValue)
        ? (initialValue as string[]).join("\n")
        : typeof initialValue === "string"
        ? initialValue
        : ""
      : initialValue == null
      ? ""
      : typeof initialValue === "object"
      ? JSON.stringify(initialValue)
      : String(initialValue);

  const [value, setValue] = useState(initialString);
  const [revealSecret, setRevealSecret] = useState(false);
  const dirty = value !== initialString;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      let parsed: unknown = value;
      if (field.kind === "url_list") {
        parsed = value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (
        field.path === "max_per_run" ||
        field.path === "icp_threshold" ||
        field.path === "max_drafts_per_run" ||
        field.path === "min_confidence" ||
        field.path === "lookback_days"
      ) {
        const n = Number(value);
        parsed = Number.isFinite(n) ? n : value;
      }
      const r = await updateAgentConfig({
        agentId,
        path: field.path,
        value: parsed,
      });
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  }

  const anchorId = `field-${field.path.replace(/\./g, "-")}`;

  return (
    <div id={anchorId} className="scroll-mt-24">
      <label className="block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-white">
            {field.label}
            {field.required && (
              <span className="ml-1.5 text-xs font-normal text-[#C89B3C]" title="Required">
                Required
              </span>
            )}
          </span>
          {field.kind === "oauth_gmail" && (
            <ConnectionStatus value={value} />
          )}
        </div>
        {field.help && (
          <p className="mt-1 text-xs text-white/65 leading-relaxed">
            {field.help}
          </p>
        )}

        {field.kind === "url_list" ? (
          <textarea
            rows={Math.min(8, Math.max(3, value.split("\n").length + 1))}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.placeholder ?? "https://..."}
            className="mt-2 w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fern-500 outline-none font-mono"
          />
        ) : field.kind === "secret" ? (
          <div className="mt-2 flex items-stretch gap-2">
            <input
              type={revealSecret ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder ?? "••••••••"}
              className="flex-1 bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fern-500 outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setRevealSecret((s) => !s)}
              className="px-3 text-xs text-white/75 hover:text-white border border-white/15 rounded-md hover:bg-white/5"
            >
              {revealSecret ? "Hide" : "Show"}
            </button>
          </div>
        ) : field.kind === "oauth_gmail" ? (
          <div className="mt-2 flex items-stretch gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder ?? "you@yourbusiness.com"}
              className="flex-1 bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fern-500 outline-none"
            />
            <button
              type="button"
              onClick={() =>
                alert(
                  "OAuth flow not wired yet. Until then, paste the inbox address here and Fern will set up the OAuth grant manually."
                )
              }
              className="px-3 text-xs text-white bg-fern-700 hover:bg-fern-600 rounded-md font-medium"
            >
              Reconnect
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.placeholder}
            className="mt-2 w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fern-500 outline-none"
          />
        )}
      </label>

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || !dirty}
          className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && !dirty && (
          <span className="text-xs text-fern-300">Saved.</span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

function ConnectionStatus({ value }: { value: string }) {
  if (!value || !value.includes("@")) {
    return (
      <span className="text-xs font-medium text-white/55 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
        Not connected
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-fern-300 bg-fern-700/15 border border-fern-700/30 px-2 py-0.5 rounded">
      Connected
    </span>
  );
}

/**
 * Read a dotted path out of a nested object. Returns undefined when any
 * step is missing. Used so we can address `gmail.account` in agent.config
 * without ad-hoc traversal in every render.
 */
function getPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}
