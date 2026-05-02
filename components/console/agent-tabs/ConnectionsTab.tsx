"use client";

import { useState, useTransition } from "react";

import { updateAgentConfig } from "@/app/console/agents/[id]/actions";
import type { AgentDetailData } from "@/lib/supabase/types";

/**
 * Connections tab — universal across agent types. Lets the business
 * self-serve their integrations without messaging Fern: Gmail OAuth,
 * API keys, source URL lists, etc.
 *
 * Fields are driven by CONNECTION_SPEC_BY_TYPE so each agent type
 * shows only the connections it actually needs. Same agent type
 * across different businesses gets the same fields — interface is
 * locked to the agent.
 */

type FieldKind = "oauth_gmail" | "secret" | "text" | "url_list";

type ConnectionField = {
  /** key inside agent.config (dotted path supported, e.g. "gmail.account") */
  path: string;
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
};

type ConnectionSection = {
  title: string;
  description?: string;
  fields: ConnectionField[];
};

const CONNECTION_SPEC_BY_TYPE: Record<string, ConnectionSection[]> = {
  customer_qa: [
    {
      title: "Gmail",
      description:
        "Inbox the agent watches and the address it replies from.",
      fields: [
        { path: "gmail.account", label: "Inbox address", kind: "oauth_gmail",
          help: "Authorize Fern to read this inbox and create drafts." },
        { path: "gmail.reply_to", label: "Reply-to override", kind: "text",
          placeholder: "Leave empty to reply from the inbox above",
          help: "Optional. If set, replies use this address." },
      ],
    },
    {
      title: "Polling",
      fields: [
        { path: "poll_query", label: "Gmail search query", kind: "text",
          placeholder: "is:unread newer_than:1d",
          help: "Standard Gmail search syntax. Restricts which messages the agent picks up." },
        { path: "max_per_run", label: "Max messages per run", kind: "text",
          placeholder: "20" },
      ],
    },
  ],
  enrollment_funnel: [
    {
      title: "Gmail",
      description: "Program inbox the agent watches.",
      fields: [
        { path: "gmail.account", label: "Inbox address", kind: "oauth_gmail" },
      ],
    },
    {
      title: "CourtReserve",
      description: "Used to confirm evaluation-class signups + look up coach availability.",
      fields: [
        { path: "courtreserve.api_url", label: "API base URL", kind: "url_list",
          placeholder: "https://app.courtreserve.com/api/...",
          help: "Single URL — use the URL list field for one entry." },
        { path: "courtreserve.api_key", label: "API key", kind: "secret",
          help: "Stored encrypted; never shown in plain text after save." },
      ],
    },
    {
      title: "Polling",
      fields: [
        { path: "poll_query", label: "Gmail search query", kind: "text",
          placeholder: "is:unread newer_than:1d" },
        { path: "max_per_run", label: "Max messages per run", kind: "text",
          placeholder: "20" },
        { path: "program_name", label: "Program name", kind: "text",
          placeholder: "Tier 1 Performance",
          help: "Shown to applicants in the welcome email." },
      ],
    },
  ],
  tournament_reports: [
    {
      title: "Tournament data sources",
      description: "Public sites the agent scans when generating a report. Add the URL patterns the agent should search.",
      fields: [
        { path: "source_config.usta_tennislink.urls", label: "USTA TennisLink URLs", kind: "url_list" },
        { path: "source_config.utr.urls", label: "UTR URLs", kind: "url_list" },
        { path: "source_config.tennis_recruiting.urls", label: "TennisRecruiting URLs", kind: "url_list" },
      ],
    },
  ],
  golf_lead_finder: [
    {
      title: "Gmail",
      description: "Where approved outreach emails are sent from.",
      fields: [
        { path: "gmail.account", label: "Send-from address", kind: "oauth_gmail" },
      ],
    },
    {
      title: "Public golf data sources",
      description: "Add the page URLs the agent should scan each week. WSC's golf coach edits these — same data sources, different watchlists per business.",
      fields: [
        { path: "source_config.ajga.urls", label: "AJGA pages", kind: "url_list",
          placeholder: "https://www.ajga.org/players/leaderboard" },
        { path: "source_config.junior_golf_scoreboard.urls", label: "Junior Golf Scoreboard pages", kind: "url_list",
          placeholder: "https://www.jgscoreboard.com/rankings/state/WA" },
        { path: "source_config.junior_golf_hub.urls", label: "Junior Golf Hub pages", kind: "url_list" },
        { path: "source_config.wiaa_wa_golf.urls", label: "WIAA / state golf pages", kind: "url_list" },
      ],
    },
    {
      title: "Contact resolution",
      description: "Optional — used to find a parent's email when the page only lists the kid.",
      fields: [
        { path: "hunter_io.api_key", label: "Hunter.io API key", kind: "secret",
          help: "Optional. If supplied, the agent attempts email lookups; without it, prospects without contact info are skipped." },
      ],
    },
    {
      title: "Throttle",
      fields: [
        { path: "icp_threshold", label: "Min ICP score (0–10)", kind: "text", placeholder: "6" },
        { path: "max_per_run", label: "Max prospects per run", kind: "text", placeholder: "10" },
      ],
    },
  ],
  signal_hunter: [
    {
      title: "Gmail",
      fields: [
        { path: "gmail.account", label: "Send-from address", kind: "oauth_gmail" },
      ],
    },
    {
      title: "Source URLs",
      description: "Per-source URL lists the agent scans on each run.",
      fields: [
        { path: "source_config.usta_tennislink_wa_juniors.urls", label: "USTA TennisLink", kind: "url_list" },
        { path: "source_config.utr_state_search.urls", label: "UTR state search", kind: "url_list" },
      ],
    },
    {
      title: "Contact resolution",
      fields: [
        { path: "hunter_io.api_key", label: "Hunter.io API key", kind: "secret" },
      ],
    },
    {
      title: "Throttle",
      fields: [
        { path: "icp_threshold", label: "Min ICP score (0–10)", kind: "text", placeholder: "7" },
        { path: "max_per_run", label: "Max prospects per run", kind: "text", placeholder: "30" },
      ],
    },
  ],
  competitor_watch: [
    {
      title: "Watchlist",
      description: "Competitor sites the agent scans every week. Add the homepage; add specific pages (pricing, events) if you want them tracked too.",
      fields: [
        { path: "watchlist", label: "Competitor homepages", kind: "url_list",
          help: "One URL per line. Each becomes a tracked competitor." },
      ],
    },
    {
      title: "Delivery",
      fields: [
        { path: "gmail.account", label: "Email digest to", kind: "text",
          placeholder: "owner@yourbusiness.com",
          help: "Where the weekly recap is delivered." },
        { path: "delivery_day", label: "Delivery day", kind: "text",
          placeholder: "Monday" },
      ],
    },
  ],
  corporate_event_hunter: [
    {
      title: "Gmail",
      fields: [
        { path: "gmail.account", label: "Send-from address", kind: "oauth_gmail" },
      ],
    },
    {
      title: "Signal sources",
      description: "Public news sources the agent monitors.",
      fields: [
        { path: "signal_sources_urls", label: "News page URLs", kind: "url_list",
          help: "GeekWire, Puget Sound Business Journal, etc." },
      ],
    },
    {
      title: "Throttle",
      fields: [
        { path: "min_confidence", label: "Min confidence (1–10)", kind: "text", placeholder: "7" },
        { path: "max_drafts_per_run", label: "Max drafts per run", kind: "text", placeholder: "5" },
        { path: "lookback_days", label: "Lookback days", kind: "text", placeholder: "7" },
      ],
    },
  ],
};

export default function ConnectionsTab({ data }: { data: AgentDetailData }) {
  const agentType =
    typeof (data.agent.config as Record<string, unknown>)?.type === "string"
      ? ((data.agent.config as Record<string, unknown>).type as string)
      : null;
  const sections: ConnectionSection[] = (agentType
    ? CONNECTION_SPEC_BY_TYPE[agentType]
    : null) ?? [
    {
      title: "Connections",
      description:
        "This agent type doesn't have configurable connections yet.",
      fields: [],
    },
  ];

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

  return (
    <div>
      <label className="block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-white">{field.label}</span>
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
