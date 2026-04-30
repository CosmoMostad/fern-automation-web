"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

import { Sidebar, TopBar } from "@/components/console/Shell";
import TimelineTab from "@/components/console/agent-tabs/TimelineTab";
import KnowledgeTab from "@/components/console/agent-tabs/KnowledgeTab";
import ExamplesTab from "@/components/console/agent-tabs/ExamplesTab";
import AgentSettingsTab from "@/components/console/agent-tabs/AgentSettingsTab";

import type { AgentDetailData } from "@/lib/supabase/types";

type Tab = "timeline" | "knowledge" | "examples" | "settings";

const TABS: { id: Tab; label: string; subtitle: string }[] = [
  { id: "timeline", label: "Timeline", subtitle: "every action this agent has taken" },
  { id: "knowledge", label: "Knowledge", subtitle: "facts, policies, and tone the agent reads before every reply" },
  { id: "examples", label: "Examples", subtitle: "few-shot email pairs that anchor the agent's voice" },
  { id: "settings", label: "Settings", subtitle: "name, description, status, run cadence" },
];

export default function AgentDetailShell({
  data,
  initialTab,
}: {
  data: AgentDetailData;
  initialTab: Tab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeTab: Tab = (searchParams.get("tab") as Tab) ?? initialTab;

  function setTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const liveDot =
    data.agent.status === "live"
      ? "bg-fern-500 pulse-dot"
      : data.agent.status === "in-build"
      ? "bg-[#C89B3C] pulse-dot-amber"
      : "bg-white/30";

  const statusLabel =
    data.agent.status === "live" ? "Live"
    : data.agent.status === "in-build" ? "In build"
    : data.agent.status === "paused" ? "Paused"
    : data.agent.status === "archived" ? "Archived"
    : "Scoped";

  return (
    <div className="grid grid-cols-[210px_1fr] min-h-screen">
      <Sidebar isDemo={false} />
      <div className="grid grid-rows-[56px_1fr] min-w-0">
        <TopBar
          business={data.org.name}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[
            { label: "Agents", href: "/console" },
            { label: data.agent.name },
          ]}
        />
        <main className="overflow-y-auto">
          <div className="px-8 pt-8 pb-4 border-b border-white/8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-end justify-between flex-wrap gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${liveDot}`} />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/65">
                    {statusLabel}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {data.agent.name}
                </h1>
                {data.agent.description && (
                  <p className="mt-1 text-sm text-white/65 max-w-xl">
                    {data.agent.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Stat
                  label="Knowledge docs"
                  value={(data.org_knowledge.length + data.agent_knowledge.length).toString()}
                />
                <Stat label="Examples" value={data.examples.length.toString()} />
                <Stat
                  label="Open escalations"
                  value={data.open_escalations.length.toString()}
                  warn={data.open_escalations.length > 0}
                />
              </div>
            </motion.div>

            <nav className="mt-6 flex gap-1">
              {TABS.map((t) => {
                const active = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative px-4 py-2.5 text-sm rounded-md transition ${
                      active
                        ? "text-white bg-white/8"
                        : "text-white/55 hover:text-white hover:bg-white/4"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
            <p className="mt-2 text-xs text-white/45">
              {TABS.find((t) => t.id === activeTab)?.subtitle}
            </p>
          </div>

          <div className="p-8">
            {activeTab === "timeline" && <TimelineTab data={data} />}
            {activeTab === "knowledge" && <KnowledgeTab data={data} />}
            {activeTab === "examples" && <ExamplesTab data={data} />}
            {activeTab === "settings" && <AgentSettingsTab data={data} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-wider text-white/55">
        {label}
      </div>
      <div className={`mt-0.5 text-base font-semibold ${warn ? "text-[#E8B85E]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
