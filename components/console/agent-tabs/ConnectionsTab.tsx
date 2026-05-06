"use client";

import { useSearchParams } from "next/navigation";
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

      <GmailFlowBanner />

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

/**
 * Surfaces the result of a Gmail OAuth round trip when the user lands back
 * on the agent page from /console/connections/gmail/callback. Reads the
 * ?gmail=... and ?reason=... query params written by the callback handler.
 */
function GmailFlowBanner() {
  const params = useSearchParams();
  const status = params.get("gmail");
  const reason = params.get("reason");
  if (!status) return null;

  if (status === "connected") {
    return (
      <div className="border border-fern-700/40 bg-fern-700/10 text-fern-200 rounded-lg px-4 py-3 text-sm">
        Gmail connected. The agent will pick up the new credentials on its next run.
      </div>
    );
  }
  if (status === "error") {
    const human = humanReason(reason);
    return (
      <div className="border border-red-500/40 bg-red-500/10 text-red-200 rounded-lg px-4 py-3 text-sm">
        <div className="font-medium">Couldn't connect Gmail.</div>
        <div className="mt-1 text-red-200/85">{human}</div>
      </div>
    );
  }
  return null;
}

function humanReason(reason: string | null): string {
  switch (reason) {
    case "missing_code_or_state":
      return "Google didn't return the expected response. Try again.";
    case "state_invalid":
      return "Sign-in took too long or the link was opened twice. Click Connect Gmail again.";
    case "user_mismatch":
      return "The signed-in account changed mid-flow. Sign out, sign back in, then retry.";
    case "no_refresh_token":
      return "Google didn't issue a refresh token — usually because Fern was previously connected to this address. Revoke prior consent at https://myaccount.google.com/permissions, then retry.";
    case "no_email_in_id_token":
      return "Google didn't share your verified email address. Make sure you used a Gmail or Google Workspace account.";
    case "token_exchange_failed":
      return "Google rejected the auth code. The OAuth client may have been rotated server-side — let Fern know.";
    case "encryption_failed":
      return "Server-side token encryption failed. Let Fern know.";
    case "agent_read_failed":
    case "agent_update_failed":
      return "Couldn't write the connection to the database. Try again.";
    case "server_oauth_not_configured":
      return "Server-side Google credentials are missing. Let Fern know.";
    case "access_denied":
      return "You clicked Cancel on the Google consent screen.";
    default:
      return reason ? `Reason: ${reason}` : "Unknown error. Try again.";
  }
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
              config={config}
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
  config,
}: {
  field: ConnectionField;
  agentId: string;
  initialValue: unknown;
  config: Record<string, unknown>;
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
            <ConnectionStatus connected={isGmailConnected(config)} />
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
          <GmailConnect
            agentId={agentId}
            config={config}
            placeholder={field.placeholder ?? "you@yourbusiness.com"}
          />
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

      {field.kind !== "oauth_gmail" && (
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
      )}
    </div>
  );
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  if (!connected) {
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
 * "Connected" requires both the Google-supplied email AND an encrypted
 * refresh token. Email alone (legacy text-input state) does not count —
 * the agent runtime needs the token to actually open the mailbox.
 */
function isGmailConnected(config: Record<string, unknown>): boolean {
  const gmail = (config?.gmail as Record<string, unknown> | undefined) ?? {};
  return (
    typeof gmail.account === "string" &&
    gmail.account.length > 0 &&
    typeof gmail.refresh_token_encrypted === "string" &&
    (gmail.refresh_token_encrypted as string).length > 0
  );
}

/**
 * Connect / Reconnect / Disconnect UI for the oauth_gmail field.
 *
 * Disconnected state: a single Connect Gmail link → /console/connections/gmail/start
 * Connected state:    "Connected as <email>" + Reconnect link + Disconnect button
 *
 * Reconnect points at the same /start URL — Google will silently reuse the
 * existing grant if scopes haven't changed; otherwise the user re-consents.
 */
function GmailConnect({
  agentId,
  config,
  placeholder,
}: {
  agentId: string;
  config: Record<string, unknown>;
  placeholder: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const connected = isGmailConnected(config);
  const gmail = (config?.gmail as Record<string, unknown> | undefined) ?? {};
  const account = typeof gmail.account === "string" ? gmail.account : "";
  const startHref = `/console/connections/gmail/start?agent_id=${encodeURIComponent(agentId)}`;

  function disconnect() {
    if (!confirm(`Disconnect Gmail (${account})?\n\nThe agent will stop being able to read or draft until you reconnect.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await updateAgentConfig({ agentId, path: "gmail", value: null });
      if (!r.ok) setError(r.error);
      else window.location.reload();
    });
  }

  if (!connected) {
    return (
      <div className="mt-2">
        <a
          href={startHref}
          className="inline-flex items-center gap-2 text-sm bg-fern-700 hover:bg-fern-600 text-white font-medium px-4 py-2 rounded-md transition"
        >
          Connect Gmail
        </a>
        <p className="mt-2 text-xs text-white/55">
          Sign in with Google to grant Fern read + draft access on this inbox
          ({placeholder}). You can revoke at any time from Google Account
          settings.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-white/90 bg-white/[0.03] border border-white/10 rounded px-2.5 py-1.5">
          {account}
        </span>
        <a
          href={startHref}
          className="text-xs text-white/75 hover:text-white border border-white/15 rounded-md px-2.5 py-1.5 hover:bg-white/5"
        >
          Reconnect
        </a>
        <button
          type="button"
          onClick={disconnect}
          disabled={pending}
          className="text-xs text-red-300 hover:text-red-200 border border-red-500/30 rounded-md px-2.5 py-1.5 hover:bg-red-500/10 disabled:opacity-40"
        >
          {pending ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
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
