"use client";

import { useMemo, useState } from "react";

import type { CatalogEntry } from "@/lib/db/catalog";
import type { AgentTypeCategory } from "@/lib/supabase/types";

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

/**
 * Read-only catalog of every agent type Fern offers. Businesses browse
 * here to understand what we can build for them. There's no Install
 * button — adding an agent requires reaching out to Fern (so pricing
 * stays sane and we can scope the build properly).
 */
export default function CatalogView({ entries }: { entries: CatalogEntry[] }) {
  const [filter, setFilter] = useState<AgentTypeCategory | "all">("all");

  const grouped = useMemo(() => {
    const out = new Map<AgentTypeCategory, CatalogEntry[]>();
    for (const cat of CATEGORY_ORDER) out.set(cat, []);
    for (const e of entries) {
      if (filter !== "all" && e.category !== filter) continue;
      out.get(e.category)?.push(e);
    }
    return out;
  }, [entries, filter]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agent catalog</h1>
        <p className="mt-1 text-sm text-white/65 max-w-2xl">
          Every kind of agent Fern has built. Browse to see what fits your
          business. When something does, reach out — we&rsquo;ll scope the
          build, set up the connections, and add it to your console.
        </p>
      </div>

      <div className="mt-6 flex gap-1 border-b border-white/8 pb-px overflow-x-auto">
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
              <h2 className="text-sm font-semibold text-white/85 mb-3">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
            </section>
          );
        })}
        {Array.from(grouped.values()).every((arr) => arr.length === 0) && (
          <div className="text-sm text-white/55 py-12 text-center">
            No agents in this category yet.
          </div>
        )}
      </div>

      <ContactCard />
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
      className={`px-3 py-2 text-sm border-b-2 transition -mb-px whitespace-nowrap ${
        active
          ? "border-fern-500 text-white"
          : "border-transparent text-white/55 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function EntryCard({ entry }: { entry: CatalogEntry }) {
  return (
    <div className="bg-white/[0.02] border border-white/8 rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{entry.name}</h3>
            {entry.installed && (
              <span className="text-xs font-medium text-fern-300 bg-fern-700/15 border border-fern-700/30 px-2 py-0.5 rounded">
                Installed
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-white/55">
            {TRIGGER_LABEL[entry.trigger_kind] ?? entry.trigger_kind}
          </div>
        </div>
      </div>

      {entry.description && (
        <p className="mt-3 text-sm text-white/75 leading-relaxed">
          {entry.description}
        </p>
      )}
    </div>
  );
}

function ContactCard() {
  return (
    <div className="mt-12 rounded-xl border border-white/10 bg-fern-700/[0.06] p-6">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h3 className="text-base font-semibold text-white">
            See something you want?
          </h3>
          <p className="mt-1.5 text-sm text-white/75 leading-relaxed max-w-md">
            Reach out and we&rsquo;ll scope the build. Pricing depends on
            which agents you run and how complex your workflows are — we
            put real numbers on the table before we start.
          </p>
          <p className="mt-2 text-sm text-white/65">
            Don&rsquo;t see it in the catalog? We custom-build agents for
            specific workflows too. Tell us what your team does manually
            today.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <a
            href="mailto:cosmo@fernautomation.com"
            className="bg-fern-700 hover:bg-fern-600 text-white text-sm font-medium px-5 py-2.5 rounded-md transition text-center"
          >
            Email Fern
          </a>
          <a
            href="https://fernautomation.com#contact"
            className="text-fern-300 hover:text-white text-xs font-medium px-5 py-2 rounded-md text-center"
          >
            Contact form →
          </a>
        </div>
      </div>
    </div>
  );
}
