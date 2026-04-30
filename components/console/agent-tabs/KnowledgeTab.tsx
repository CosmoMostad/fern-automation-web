"use client";

import { useState, useTransition } from "react";

import {
  createKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
} from "@/app/console/agents/[id]/actions";
import type { AgentDetailData, KnowledgeDoc } from "@/lib/supabase/types";

export default function KnowledgeTab({ data }: { data: AgentDetailData }) {
  return (
    <div className="space-y-8 max-w-3xl">
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

        <CreateDocForm
          orgId={data.org.id}
          agentId={data.agent.id}
          scope="agent"
        />
      </section>
    </div>
  );
}

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
        <div>
          <div className="text-sm text-white">{doc.title}</div>
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
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
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
