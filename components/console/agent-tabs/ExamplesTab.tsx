"use client";

import { useState, useTransition } from "react";

import {
  createKnowledgeExample,
  updateKnowledgeExample,
  toggleKnowledgeExample,
  deleteKnowledgeExample,
} from "@/app/console/agents/[id]/actions";
import type { AgentDetailData, KnowledgeExample } from "@/lib/supabase/types";

export default function ExamplesTab({ data }: { data: AgentDetailData }) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold text-white">Few-shot examples</h3>
        <p className="mt-1 text-xs text-white/55 max-w-xl">
          Pairs of (incoming message → ideal reply) the agent reads before drafting. The
          best examples here directly shape the agent&rsquo;s voice. Toggle them off
          anytime without losing the data.
        </p>
      </div>

      {data.examples.length === 0 ? (
        <EmptyHint
          text="No examples yet."
          cta="Paste a real reply you've sent in the past — the agent will mirror its tone."
        />
      ) : (
        <div className="space-y-2">
          {data.examples.map((ex) => (
            <ExampleCard key={ex.id} ex={ex} agentId={data.agent.id} />
          ))}
        </div>
      )}

      <CreateExampleForm orgId={data.org.id} agentId={data.agent.id} />
    </div>
  );
}

function ExampleCard({ ex, agentId }: { ex: KnowledgeExample; agentId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(ex.label);
  const [inbound, setInbound] = useState(ex.inbound ?? "");
  const [outbound, setOutbound] = useState(ex.outbound);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateKnowledgeExample({
        exampleId: ex.id,
        agentId,
        label,
        inbound,
        outbound,
      });
      if (r.ok) {
        setEditing(false);
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  function toggle() {
    startTransition(async () => {
      const r = await toggleKnowledgeExample({
        exampleId: ex.id,
        agentId,
        active: !ex.active,
      });
      if (!r.ok) setError(r.error);
    });
  }

  function destroy() {
    if (!confirm(`Delete example "${ex.label}"?`)) return;
    startTransition(async () => {
      const r = await deleteKnowledgeExample({ exampleId: ex.id, agentId });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div
      className={`rounded-lg border bg-white/[0.025] transition ${
        ex.active ? "border-white/8" : "border-white/5 opacity-60"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{ex.label}</span>
            {!ex.active && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/45 px-1.5 py-0.5 rounded bg-white/8">
                inactive
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-white/35 mt-0.5 truncate">
            {ex.inbound ? `↓ ${ex.inbound.slice(0, 60)}…` : "(no inbound)"} &nbsp;·&nbsp;
            ↑ {ex.outbound.slice(0, 60)}…
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
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {editing ? (
            <>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. polite_first_nudge)"
                className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
              />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                  Inbound (optional)
                </div>
                <textarea
                  rows={3}
                  value={inbound}
                  onChange={(e) => setInbound(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
                />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                  Outbound (the desired reply)
                </div>
                <textarea
                  rows={5}
                  value={outbound}
                  onChange={(e) => setOutbound(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
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
                    setLabel(ex.label);
                    setInbound(ex.inbound ?? "");
                    setOutbound(ex.outbound);
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
              {ex.inbound && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                    Inbound
                  </div>
                  <pre className="text-xs text-white/75 whitespace-pre-wrap font-sans leading-relaxed bg-white/[0.02] rounded p-3">
                    {ex.inbound}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
                  Outbound
                </div>
                <pre className="text-xs text-white/85 whitespace-pre-wrap font-sans leading-relaxed bg-fern-700/10 border border-fern-700/20 rounded p-3">
                  {ex.outbound}
                </pre>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md transition"
                >
                  Edit
                </button>
                <button
                  onClick={toggle}
                  disabled={pending}
                  className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                >
                  {ex.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={destroy}
                  disabled={pending}
                  className="text-xs text-red-400/85 hover:text-red-300 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                >
                  Delete
                </button>
                {error && <span className="text-xs text-red-400">{error}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateExampleForm({ orgId, agentId }: { orgId: string; agentId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [inbound, setInbound] = useState("");
  const [outbound, setOutbound] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createKnowledgeExample({
        orgId,
        agentId,
        label,
        inbound,
        outbound,
      });
      if (r.ok) {
        setLabel("");
        setInbound("");
        setOutbound("");
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
        <span className="text-sm text-white/65 hover:text-white">+ Add example</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4 space-y-3">
      <input
        autoFocus
        placeholder="Label (e.g. tier1_member_courtesy)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
      />
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
          Inbound (optional)
        </div>
        <textarea
          rows={3}
          placeholder="The kind of message this example responds to. Leave blank for output-only patterns."
          value={inbound}
          onChange={(e) => setInbound(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
        />
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/45 mb-1">
          Outbound (the desired reply)
        </div>
        <textarea
          rows={5}
          placeholder="The exact tone, structure, and content you want the agent to imitate."
          value={outbound}
          onChange={(e) => setOutbound(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-sans focus:border-fern-700 outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          onClick={submit}
          className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          Add example
        </button>
        <button
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setLabel("");
            setInbound("");
            setOutbound("");
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
