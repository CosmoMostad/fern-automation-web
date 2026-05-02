"use client";

import type { AgentDetailData } from "@/lib/supabase/types";

/**
 * Competitors tab — for competitor_watch agents.
 *
 * Reads the watchlist from agent.config and pairs each competitor with
 * the most recent digest message the agent produced (when available).
 * Click any competitor URL to open it in a new tab; click "View latest
 * digest" to expand the most recent weekly summary inline.
 */
export default function CompetitorsTab({ data }: { data: AgentDetailData }) {
  const watchlist = ((data.agent.config as Record<string, unknown>)
    ?.watchlist ?? []) as Array<{ name: string; url: string; pages?: string[] }>;

  // Latest digest = most recent outbound message from this agent
  const latestDigest = data.recent_messages
    .filter(
      (m) =>
        m.direction === "outbound" &&
        (m.status === "sent" || m.status === "approved" || m.status === "pending_approval")
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Competitors watched" value={watchlist.length.toString()} />
        <Stat
          label="Last digest"
          value={
            latestDigest ? timeAgo(latestDigest.created_at) : "—"
          }
        />
        <Stat
          label="Run cadence"
          value={
            ((data.agent.config as Record<string, unknown>)?.run_cadence as string) ??
            "weekly"
          }
        />
        <Stat
          label="Status"
          value={data.agent.status === "live" ? "Live" : data.agent.status}
        />
      </div>

      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-12 px-6 text-center">
          <div className="text-sm font-medium text-white">
            No competitors watched yet.
          </div>
          <p className="mt-1.5 text-sm text-white/65 max-w-md mx-auto">
            Add competitor URLs to the agent&rsquo;s config so it can scan
            them weekly and produce a digest of changes.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-white/85 mb-3">
            Watchlist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {watchlist.map((c, i) => (
              <CompetitorCard key={i} c={c} />
            ))}
          </div>
        </div>
      )}

      {latestDigest && (
        <div>
          <h3 className="text-sm font-semibold text-white/85 mb-3">
            Latest digest
          </h3>
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
            <div className="text-sm font-semibold text-white">
              {latestDigest.subject ?? "(no subject)"}
            </div>
            <div className="mt-1 text-xs text-white/55">
              {timeAgo(latestDigest.created_at)} ·{" "}
              {latestDigest.status.replace(/_/g, " ")}
            </div>
            <div className="mt-3 text-sm text-white/85 whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto pr-2">
              {latestDigest.body ?? latestDigest.body_preview ?? "(empty)"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorCard({
  c,
}: {
  c: { name: string; url: string; pages?: string[] };
}) {
  const host = (() => {
    try {
      return new URL(c.url).host.replace(/^www\./, "");
    } catch {
      return c.url;
    }
  })();
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="text-sm font-semibold text-white">{c.name}</div>
      <a
        href={c.url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block text-xs text-fern-300 hover:text-white truncate"
      >
        {host} ↗
      </a>
      {c.pages && c.pages.length > 0 && (
        <div className="mt-2 text-xs text-white/55">
          + {c.pages.length} additional page{c.pages.length === 1 ? "" : "s"}{" "}
          tracked
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
      <div className="text-xs font-medium text-white/75">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
