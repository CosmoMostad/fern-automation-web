"use client";

import { useMemo, useState, useTransition } from "react";

import {
  installAgent,
  uninstallAgent,
} from "@/app/console/marketplace/actions";
import type {
  AgentTypeCategory,
  MarketplaceAgentType,
} from "@/lib/supabase/types";

const CATEGORY_LABELS: Record<AgentTypeCategory, string> = {
  customer_ops: "Customer ops",
  lead_generation: "Lead generation",
  analytics: "Analytics & reports",
  workflow: "Workflow",
};

const CATEGORY_ORDER: AgentTypeCategory[] = [
  "customer_ops",
  "lead_generation",
  "analytics",
  "workflow",
];

const TRIGGER_LABEL: Record<string, string> = {
  cron: "Runs on schedule",
  inbound: "Reacts to email",
  on_demand: "Triggered from console",
};

export default function MarketplaceView({
  types,
}: {
  types: MarketplaceAgentType[];
}) {
  const [filter, setFilter] = useState<AgentTypeCategory | "all">("all");
  const [showArchived, setShowArchived] = useState(false);

  const grouped = useMemo(() => {
    const out = new Map<AgentTypeCategory, MarketplaceAgentType[]>();
    for (const cat of CATEGORY_ORDER) out.set(cat, []);
    for (const t of types) {
      if (filter !== "all" && t.category !== filter) continue;
      if (!showArchived && t.installed_status === "archived") continue;
      out.get(t.category)?.push(t);
    }
    return out;
  }, [types, filter, showArchived]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Agent marketplace</h1>
          <p className="mt-1 text-sm text-white/55 max-w-2xl">
            Browse the catalog of agent types and install the ones your business
            needs. Each install gets its own knowledge bucket, examples, and
            credentials — same code, different memory.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/55 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="accent-fern-700"
          />
          Show archived
        </label>
      </div>

      <div className="mt-6 flex gap-1 border-b border-white/8 pb-px">
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {CATEGORY_ORDER.map((c) => (
          <FilterTab
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={CATEGORY_LABELS[c]}
          />
        ))}
      </div>

      <div className="mt-8 space-y-10">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (filter !== "all" && filter !== cat) return null;
          if (items.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 mb-3">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((t) => (
                  <TypeCard key={t.id} type={t} />
                ))}
              </div>
            </section>
          );
        })}
        {Array.from(grouped.values()).every((arr) => arr.length === 0) && (
          <div className="text-sm text-white/55 py-12 text-center">
            No agent types match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm border-b-2 transition -mb-px ${
        active
          ? "border-fern-500 text-white"
          : "border-transparent text-white/55 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function TypeCard({ type }: { type: MarketplaceAgentType }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isInstalled = !!type.installed_agent_id;
  const isArchived = type.installed_status === "archived";

  function onInstall() {
    setError(null);
    startTransition(async () => {
      const r = await installAgent(type.key);
      if (!r.ok) setError(r.error);
    });
  }

  function onUninstall() {
    if (!type.installed_agent_id) return;
    if (!confirm(`Archive ${type.name}? You can reinstall it later.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await uninstallAgent(type.installed_agent_id!);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="bg-white/[0.02] border border-white/8 rounded-lg p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{type.name}</h3>
            {isInstalled && !isArchived && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-fern-300 bg-fern-700/15 border border-fern-700/30 px-1.5 py-0.5 rounded">
                Installed
              </span>
            )}
            {isArchived && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-white/45 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                Archived
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] font-mono text-white/35">
            {type.key} · {TRIGGER_LABEL[type.trigger_kind] ?? type.trigger_kind}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-white/65 leading-relaxed flex-1">
        {type.description}
      </p>

      <div className="mt-4 pt-3 border-t border-white/8 flex items-center gap-3">
        {!isInstalled || isArchived ? (
          <button
            onClick={onInstall}
            disabled={pending}
            className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition"
          >
            {pending ? "Installing…" : isArchived ? "Re-install" : "Install"}
          </button>
        ) : (
          <>
            <a
              href={`/console/agents/${type.installed_agent_id}`}
              className="text-sm text-fern-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-fern-700/10 transition"
            >
              Open
            </a>
            <button
              onClick={onUninstall}
              disabled={pending}
              className="text-xs text-white/55 hover:text-white disabled:opacity-40 px-3 py-1.5 rounded-md hover:bg-white/5 transition"
            >
              {pending ? "Archiving…" : "Archive"}
            </button>
          </>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}
