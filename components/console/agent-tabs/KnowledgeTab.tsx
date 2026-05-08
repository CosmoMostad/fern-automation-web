"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  cancelScrapeRequest,
  createKnowledgeDoc,
  deleteKnowledgeDoc,
  requestScrape,
  updateKnowledgeDoc,
} from "@/app/console/agents/[id]/actions";
import type {
  AgentDetailData,
  KnowledgeDoc,
  ScrapeRequest,
} from "@/lib/supabase/types";

export default function KnowledgeTab({ data }: { data: AgentDetailData }) {
  // Live-refresh while scrape jobs are in flight.
  const activeScrapes = data.scrape_requests.filter(
    (r) => r.status === "pending" || r.status === "running"
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <ScrapeProgressPoller activeCount={activeScrapes.length} />

      {/* Org base layer */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Business profile</h3>
            <p className="mt-1 text-xs text-white/55">
              Shared across every agent in {data.org.name}. Edit in Settings &rarr; Business.
            </p>
          </div>
          <a
            href="/console/settings/business"
            className="plain text-xs text-fern-400 hover:text-fern-300"
          >
            Edit business profile &rarr;
          </a>
        </header>

        {data.org_knowledge.length === 0 ? (
          <EmptyHint
            text="No business-wide knowledge yet."
            cta="Add your hours, voice, and signature in Settings."
          />
        ) : (
          <div className="space-y-2">
            {data.org_knowledge.map((d) => (
              <DocCard key={d.id} doc={d} editable={false} agentId={data.agent.id} />
            ))}
          </div>
        )}
      </section>

      {/* Agent-scoped knowledge */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Agent knowledge</h3>
            <p className="mt-1 text-xs text-white/55">
              Only {data.agent.name} sees these. Use this for the agent&rsquo;s policies,
              procedures, FAQs, and decision rules.
            </p>
          </div>
        </header>

        {data.scrape_requests.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.scrape_requests.map((r) => (
              <ScrapeRequestRow
                key={r.id}
                request={r}
                cancelAction={(id) =>
                  cancelScrapeRequest({ requestId: id, agentId: data.agent.id })
                }
              />
            ))}
          </div>
        )}

        {data.agent_knowledge.length === 0 ? (
          <EmptyHint
            text="No agent-specific knowledge yet."
            cta={`Add the first document below — start with anything ${data.agent.name} should always remember.`}
          />
        ) : (
          <div className="space-y-2 mb-4">
            {data.agent_knowledge.map((d) => (
              <DocCard key={d.id} doc={d} editable agentId={data.agent.id} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CreateDocForm
            orgId={data.org.id}
            agentId={data.agent.id}
            scope="agent"
          />
          <ScrapeUrlForm
            submitAction={(input) =>
              requestScrape({
                orgId: data.org.id,
                agentId: data.agent.id,
                ...input,
              })
            }
          />
        </div>
      </section>
    </div>
  );
}

/* ───────────── Auto-poller for in-flight scrapes ───────────── */

export function ScrapeProgressPoller({ activeCount }: { activeCount: number }) {
  const router = useRouter();
  useEffect(() => {
    if (activeCount === 0) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [activeCount, router]);
  return null;
}

/* ───────────── Existing knowledge-doc components (unchanged) ───────────── */

function DocCard({
  doc,
  editable,
  agentId,
}: {
  doc: KnowledgeDoc;
  editable: boolean;
  agentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [body, setBody] = useState(doc.body);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateKnowledgeDoc({
        docId: doc.id,
        title,
        body,
        agentId,
      });
      if (r.ok) {
        setEditing(false);
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  function destroy() {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone (but past versions are kept).`)) return;
    startTransition(async () => {
      const r = await deleteKnowledgeDoc({ docId: doc.id, agentId });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.025]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-white">{doc.title}</span>
            {doc.source_kind === "scrape" && doc.source_url && (
              <span
                className="text-[10px] font-medium text-fern-300 bg-fern-700/15 border border-fern-700/30 px-1.5 py-0.5 rounded"
                title={`Scraped from ${doc.source_url}`}
              >
                from URL
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-white/35 mt-0.5">
            {doc.body.length} chars · last edited {timeAgo(doc.updated_at)}
          </div>
        </div>
        <span className={`text-white/35 transition-transform ${open ? "rotate-90" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {doc.source_kind === "scrape" && doc.source_url && (
            <div className="mb-2 text-[11px] text-white/55">
              Source:{" "}
              <a
                href={doc.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="plain text-fern-300 hover:text-fern-200 underline"
              >
                {doc.source_url}
              </a>
            </div>
          )}
          {editing ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white mb-2 focus:border-fern-700 outline-none"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  disabled={pending}
                  onClick={save}
                  className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  disabled={pending}
                  onClick={() => {
                    setEditing(false);
                    setTitle(doc.title);
                    setBody(doc.body);
                  }}
                  className="text-xs text-white/65 hover:text-white px-3 py-1.5 rounded-md"
                >
                  Cancel
                </button>
                {error && <span className="text-xs text-red-400">{error}</span>}
              </div>
            </>
          ) : (
            <>
              <pre className="text-xs text-white/85 whitespace-pre-wrap font-sans leading-relaxed">
                {doc.body || <span className="text-white/40 italic">(empty)</span>}
              </pre>
              {editable && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={destroy}
                    disabled={pending}
                    className="text-xs text-red-400/85 hover:text-red-300 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <a
                    href={`#`}
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Version history viewer coming next.");
                    }}
                    className="plain text-xs text-white/45 hover:text-white/85 ml-auto"
                  >
                    History
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateDocForm({
  orgId,
  agentId,
  scope,
}: {
  orgId: string;
  agentId: string;
  scope: "org" | "agent";
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createKnowledgeDoc({ agentId, scope, title, body, orgId });
      if (r.ok) {
        setTitle("");
        setBody("");
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-lg border border-dashed border-white/15 hover:border-fern-700/60 bg-white/[0.015] hover:bg-fern-700/[0.04] py-3 px-4 transition"
      >
        <span className="text-sm text-white/65 hover:text-white">+ Add knowledge document</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 sm:col-span-2">
      <input
        autoFocus
        placeholder="Title (e.g. Cancellation policy)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white mb-2 focus:border-fern-700 outline-none"
      />
      <textarea
        rows={6}
        placeholder="The agent reads this verbatim before every reply. Be specific."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
      />
      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={pending}
          onClick={submit}
          className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          Add
        </button>
        <button
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setTitle("");
            setBody("");
            setError(null);
          }}
          className="text-xs text-white/65 hover:text-white px-3 py-1.5 rounded-md"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

/* ───────────── URL → scrape form ───────────── */

type ScrapeSubmitInput = {
  url: string;
  mode: "single" | "domain";
  maxPages: number;
};
type ScrapeSubmitResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

export function ScrapeUrlForm({
  submitAction,
}: {
  submitAction: (input: ScrapeSubmitInput) => Promise<ScrapeSubmitResult>;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"single" | "domain">("domain");
  const [maxPages, setMaxPages] = useState(10);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await submitAction({ url, mode, maxPages });
      if (r.ok) {
        setUrl("");
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-lg border border-dashed border-white/15 hover:border-fern-700/60 bg-white/[0.015] hover:bg-fern-700/[0.04] py-3 px-4 transition"
      >
        <span className="text-sm text-white/65 hover:text-white">+ Scrape from URL</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 sm:col-span-2">
      <div className="text-xs text-white/55 mb-2">
        Paste a URL — we&rsquo;ll fetch the page (and same-domain interior pages, if you choose)
        and turn each one into a knowledge document.
      </div>
      <input
        autoFocus
        placeholder="https://woodinvillesportsclub.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white mb-3 focus:border-fern-700 outline-none"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-3">
        <label className="flex items-center gap-2 text-xs text-white/85">
          <input
            type="radio"
            name="scrape-mode"
            value="domain"
            checked={mode === "domain"}
            onChange={() => setMode("domain")}
            className="accent-fern-500"
          />
          <span>Whole site</span>
          <span className="text-white/45">(homepage + linked pages)</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-white/85">
          <input
            type="radio"
            name="scrape-mode"
            value="single"
            checked={mode === "single"}
            onChange={() => setMode("single")}
            className="accent-fern-500"
          />
          <span>Just this page</span>
        </label>
      </div>

      {mode === "domain" && (
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-white/65">Max pages</label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(parseInt(e.target.value, 10) || 10)}
            className="w-20 bg-black/30 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:border-fern-700 outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          disabled={pending || !url.trim()}
          onClick={submit}
          className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          {pending ? "Queueing…" : "Start scrape"}
        </button>
        <button
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setUrl("");
            setError(null);
          }}
          className="text-xs text-white/65 hover:text-white px-3 py-1.5 rounded-md"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

/* ───────────── In-flight / completed scrape row ───────────── */

export function ScrapeRequestRow({
  request: r,
  cancelAction,
}: {
  request: ScrapeRequest;
  cancelAction: (
    requestId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAction(r.id);
      if (!result.ok) setError(result.error);
    });
  }

  const tone = TONE_BY_STATUS[r.status];

  return (
    <div className={`rounded-lg border ${tone.border} ${tone.bg} px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium ${tone.label} ${tone.labelBg} border ${tone.labelBorder} px-1.5 py-0.5 rounded`}>
              {STATUS_LABEL[r.status]}
            </span>
            <span className="text-sm text-white truncate">{r.root_url}</span>
          </div>
          <div className="text-[11px] text-white/55 mt-1">
            {r.mode === "domain"
              ? `Whole site (up to ${r.max_pages} pages)`
              : "Just this page"}
            {r.status === "done" && r.result_summary && (
              <>
                {" · "}
                {r.result_summary.fetched ?? 0} fetched
                {r.result_summary.failed
                  ? `, ${r.result_summary.failed} failed`
                  : ""}
              </>
            )}
            {r.status === "failed" && r.error && (
              <span className="text-red-400">{" · "}{r.error.slice(0, 200)}</span>
            )}
          </div>
        </div>
        {r.status === "pending" && (
          <button
            disabled={pending}
            onClick={cancel}
            className="text-xs text-white/65 hover:text-white shrink-0 disabled:opacity-50"
          >
            {pending ? "…" : "Cancel"}
          </button>
        )}
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<ScrapeRequest["status"], string> = {
  pending: "Queued",
  running: "Scraping…",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const TONE_BY_STATUS: Record<
  ScrapeRequest["status"],
  {
    border: string;
    bg: string;
    label: string;
    labelBg: string;
    labelBorder: string;
  }
> = {
  pending: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.05]",
    label: "text-amber-300",
    labelBg: "bg-amber-500/15",
    labelBorder: "border-amber-500/30",
  },
  running: {
    border: "border-fern-500/30",
    bg: "bg-fern-700/[0.06]",
    label: "text-fern-300",
    labelBg: "bg-fern-700/15",
    labelBorder: "border-fern-700/30",
  },
  done: {
    border: "border-white/10",
    bg: "bg-white/[0.02]",
    label: "text-fern-300",
    labelBg: "bg-fern-700/15",
    labelBorder: "border-fern-700/30",
  },
  failed: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.05]",
    label: "text-red-300",
    labelBg: "bg-red-500/15",
    labelBorder: "border-red-500/30",
  },
  cancelled: {
    border: "border-white/10",
    bg: "bg-white/[0.015]",
    label: "text-white/55",
    labelBg: "bg-white/5",
    labelBorder: "border-white/10",
  },
};

function EmptyHint({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.015] px-4 py-6 text-center">
      <div className="text-sm text-white/65">{text}</div>
      <div className="mt-1 text-xs text-white/45">{cta}</div>
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
