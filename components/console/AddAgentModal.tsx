"use client";

import { useEffect, useState, useTransition } from "react";

import { installAgent } from "@/app/console/marketplace/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AgentType, AgentTypeCategory } from "@/lib/supabase/types";

const CATEGORY_LABEL: Record<AgentTypeCategory, string> = {
  customer_ops: "Customer ops",
  lead_generation: "Lead generation",
  analytics: "Analytics",
  workflow: "Workflow",
};

/**
 * "+ Add agent" modal. Replaces the standalone /console/marketplace route.
 * Browses the agent_types catalog inline, installs with one click, and the
 * dashboard refreshes to show the new agent card.
 */
export default function AddAgentModal({
  open,
  onClose,
  installedKeys,
}: {
  open: boolean;
  onClose: () => void;
  installedKeys: Set<string>;
}) {
  const [types, setTypes] = useState<AgentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("agent_types")
          .select("*")
          .eq("is_published", true)
          .order("position", { ascending: true });
        if (cancelled) return;
        if (error) setError(error.message);
        else setTypes((data ?? []) as AgentType[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function install(key: string) {
    setError(null);
    setBusyKey(key);
    startTransition(async () => {
      const r = await installAgent(key);
      setBusyKey(null);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onClose();
      // Hard reload so the dashboard's server-rendered agents list refreshes.
      if (typeof window !== "undefined") window.location.reload();
    });
  }

  if (!open) return null;

  // Group by category
  const groups = new Map<AgentTypeCategory, AgentType[]>();
  for (const t of types) {
    const arr = groups.get(t.category) ?? [];
    arr.push(t);
    groups.set(t.category, arr);
  }
  const orderedCats: AgentTypeCategory[] = [
    "customer_ops",
    "lead_generation",
    "analytics",
    "workflow",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl bg-[#0E1A14] border border-white/10 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/8 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Add an agent</h2>
            <p className="mt-1 text-sm text-white/65">
              Pick an agent type. It gets installed into your console with its
              own knowledge bucket, settings, and trust mode.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/55 hover:text-white text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="text-sm text-white/55 py-8 text-center">
              Loading…
            </div>
          ) : types.length === 0 ? (
            <div className="text-sm text-white/55 py-8 text-center">
              No agent types in the catalog yet.
            </div>
          ) : (
            <div className="space-y-7">
              {orderedCats.map((cat) => {
                const items = groups.get(cat) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={cat}>
                    <h3 className="text-sm font-semibold text-white/85 mb-3">
                      {CATEGORY_LABEL[cat]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((t) => {
                        const installed = installedKeys.has(t.key);
                        const busy = busyKey === t.key && pending;
                        return (
                          <div
                            key={t.id}
                            className="border border-white/8 bg-white/[0.02] rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white">
                                  {t.name}
                                </div>
                                <div className="mt-0.5 text-xs text-white/45">
                                  {triggerLabel(t.trigger_kind)}
                                </div>
                              </div>
                              {installed ? (
                                <span className="text-xs font-medium text-fern-300 bg-fern-700/15 border border-fern-700/30 px-2 py-1 rounded whitespace-nowrap">
                                  Installed
                                </span>
                              ) : (
                                <button
                                  onClick={() => install(t.key)}
                                  disabled={busy}
                                  className="text-sm bg-fern-700 hover:bg-fern-600 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition whitespace-nowrap"
                                >
                                  {busy ? "Installing…" : "Install"}
                                </button>
                              )}
                            </div>
                            {t.description && (
                              <p className="mt-2 text-sm text-white/65 leading-relaxed">
                                {t.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 text-xs text-white/45">
          Don&rsquo;t see what you need?{" "}
          <a
            href="mailto:cosmo@fernautomation.com"
            className="text-fern-300 hover:text-white"
          >
            Tell Fern
          </a>{" "}
          and we&rsquo;ll build it.
        </div>
      </div>
    </div>
  );
}

function triggerLabel(kind: AgentType["trigger_kind"]): string {
  if (kind === "cron") return "Runs on a schedule";
  if (kind === "inbound") return "Reacts to incoming email";
  if (kind === "on_demand") return "Triggered from the console";
  return kind;
}
