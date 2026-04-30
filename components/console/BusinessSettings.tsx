"use client";

import { useState, useTransition } from "react";

import { Sidebar, TopBar } from "@/components/console/Shell";
import {
  createOrgKnowledgeDoc,
  updateOrgKnowledgeDoc,
  deleteOrgKnowledgeDoc,
  updateOrgName,
} from "@/app/console/settings/business/actions";
import type { BusinessSettingsData } from "@/lib/db/business-settings";
import type { KnowledgeDoc } from "@/lib/supabase/types";

const SUGGESTED_DOCS = [
  {
    title: "What we do",
    body: "One paragraph describing what your business does, who you serve, and what you're known for. Every agent reads this before drafting any reply.",
  },
  {
    title: "Hours & location",
    body: "Hours of operation by day. Address. Phone. Anything a customer might ask about reaching you.",
  },
  {
    title: "Voice & tone",
    body: "How we sound in writing. (e.g. \"Warm and direct. Never apologetic. We use first names. We don't use exclamation marks.\")",
  },
  {
    title: "Email signature",
    body: "The exact signature block to use at the end of every outbound email.",
  },
];

export default function BusinessSettings({ data }: { data: BusinessSettingsData }) {
  return (
    <div className="grid grid-cols-[210px_1fr] min-h-screen">
      <Sidebar isDemo={false} />
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Settings", href: "/console/settings/business" }, { label: "Business profile" }]}
        />
        <main className="overflow-y-auto p-8 max-w-3xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Business profile
            </h1>
            <p className="mt-1 text-sm text-white/65">
              Facts every agent in {data.org.name} reads before drafting any reply.
              Anyone on the team can edit. Edit history is kept automatically.
            </p>
          </header>

          <section className="mb-8">
            <OrgNameEditor orgId={data.org.id} initialName={data.org.name} />
          </section>

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-white mb-3">Knowledge documents</h2>
            {data.org_knowledge.length === 0 ? (
              <SuggestedStarters orgId={data.org.id} />
            ) : (
              <div className="space-y-2 mb-4">
                {data.org_knowledge.map((d) => (
                  <DocCard key={d.id} doc={d} />
                ))}
              </div>
            )}
            <CreateForm orgId={data.org.id} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Team</h2>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] divide-y divide-white/5">
              {data.members.map((m) => (
                <div
                  key={m.id}
                  className="px-4 py-3 flex items-center justify-between text-sm"
                >
                  <span className="text-white">
                    {m.display_name ?? <span className="text-white/45">Unnamed teammate</span>}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/55">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/45">
              Member-invite UI coming next. For now, new teammates get added by
              signing in to the Console with the same magic-link flow you used.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function OrgNameEditor({
  orgId,
  initialName,
}: {
  orgId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateOrgName({ orgId, name });
      if (r.ok) {
        setEditing(false);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="text-xs font-medium text-white">Business name</div>
      <p className="mt-0.5 text-[11px] text-white/45">
        Shown across the top of every Console page.
      </p>
      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-fern-700 outline-none"
          />
          <button
            disabled={pending}
            onClick={save}
            className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-2 rounded-md disabled:opacity-50"
          >
            Save
          </button>
          <button
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setName(initialName);
              setError(null);
            }}
            className="text-xs text-white/65 hover:text-white px-3 py-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-white">{name}</span>
          <div className="flex items-center gap-2">
            {savedFlash && <span className="text-xs text-fern-300">Saved</span>}
            <button
              onClick={() => setEditing(true)}
              className="text-xs border border-white/15 hover:border-white/30 text-white/85 px-3 py-1.5 rounded-md"
            >
              Edit
            </button>
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
    </div>
  );
}

function DocCard({ doc }: { doc: KnowledgeDoc }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [body, setBody] = useState(doc.body);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateOrgKnowledgeDoc({ docId: doc.id, title, body });
      if (r.ok) {
        setEditing(false);
        setOpen(false);
      } else setError(r.error);
    });
  }

  function destroy() {
    if (!confirm(`Delete "${doc.title}"? Past versions are kept.`)) return;
    startTransition(async () => {
      const r = await deleteOrgKnowledgeDoc({ docId: doc.id });
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
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
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
                  className="text-xs text-white/65 hover:text-white px-3 py-1.5"
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateForm({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createOrgKnowledgeDoc({ orgId, title, body });
      if (r.ok) {
        setOpen(false);
        setTitle("");
        setBody("");
      } else setError(r.error);
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
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white mb-2 focus:border-fern-700 outline-none"
      />
      <textarea
        rows={6}
        placeholder="Content. Every agent reads this before drafting any reply."
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
          className="text-xs text-white/65 hover:text-white px-3 py-1.5"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

function SuggestedStarters({ orgId }: { orgId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addAll() {
    setError(null);
    startTransition(async () => {
      for (const s of SUGGESTED_DOCS) {
        const r = await createOrgKnowledgeDoc({ orgId, title: s.title, body: s.body });
        if (!r.ok) {
          setError(r.error);
          return;
        }
      }
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.015] p-5 mb-4">
      <div className="text-sm text-white/85 font-medium">No business knowledge yet.</div>
      <p className="mt-1 text-xs text-white/55 max-w-md">
        Most businesses start with the same four documents. Click below to seed
        the standard set, then edit each to fit you.
      </p>
      <ul className="mt-3 space-y-1.5">
        {SUGGESTED_DOCS.map((s) => (
          <li key={s.title} className="flex items-start gap-2 text-xs text-white/65">
            <span className="text-fern-400 mt-0.5">·</span>
            <div>
              <span className="text-white">{s.title}</span>
              <span className="text-white/45"> — {s.body.split(".")[0]}.</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <button
          disabled={pending}
          onClick={addAll}
          className="text-xs bg-fern-700 hover:bg-fern-600 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          {pending ? "Adding…" : "Seed the standard four"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
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
