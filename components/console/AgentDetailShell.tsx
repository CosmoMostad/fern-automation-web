"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

import { Sidebar, TopBar } from "@/components/console/Shell";
import TimelineTab from "@/components/console/agent-tabs/TimelineTab";
import KnowledgeTab from "@/components/console/agent-tabs/KnowledgeTab";
import ExamplesTab from "@/components/console/agent-tabs/ExamplesTab";
import AgentSettingsTab from "@/components/console/agent-tabs/AgentSettingsTab";
import StudentsTab from "@/components/console/agent-tabs/StudentsTab";
import ProspectsTab from "@/components/console/agent-tabs/ProspectsTab";
import ConversationsTab from "@/components/console/agent-tabs/ConversationsTab";
import ApplicantsTab from "@/components/console/agent-tabs/ApplicantsTab";
import CompetitorsTab from "@/components/console/agent-tabs/CompetitorsTab";
import LeadsTab from "@/components/console/agent-tabs/LeadsTab";
import ConnectionsTab from "@/components/console/agent-tabs/ConnectionsTab";

import type { AgentDetailData } from "@/lib/supabase/types";

type Tab =
  | "timeline"
  | "students"
  | "prospects"
  | "applicants"
  | "conversations"
  | "competitors"
  | "leads"
  | "knowledge"
  | "examples"
  | "connections"
  | "settings";

const BASE_TABS: { id: Tab; label: string; subtitle: string }[] = [
  { id: "timeline", label: "Timeline", subtitle: "every action this agent has taken" },
  { id: "knowledge", label: "Knowledge", subtitle: "facts, policies, and tone the agent reads before every reply" },
  { id: "examples", label: "Examples", subtitle: "few-shot email pairs that anchor the agent's voice" },
  { id: "connections", label: "Connections", subtitle: "Gmail, API keys, and data sources this agent uses" },
  { id: "settings", label: "Settings", subtitle: "name, description, status, trust mode" },
];

// Workspace tab — the "natural home" for each agent type, injected right
// after Timeline so it's the second thing operators see.
const WORKSPACE_TAB_BY_TYPE: Record<
  string,
  { id: Tab; label: string; subtitle: string }
> = {
  customer_qa: {
    id: "conversations",
    label: "Conversations",
    subtitle: "every active thread this agent is handling",
  },
  enrollment_funnel: {
    id: "applicants",
    label: "Applicants",
    subtitle: "applicants grouped by funnel stage — new inquiry through enrolled",
  },
  tournament_reports: {
    id: "students",
    label: "Students",
    subtitle: "search players, generate tournament reports, share with parents",
  },
  golf_lead_finder: {
    id: "prospects",
    label: "Prospects",
    subtitle: "leads this agent has surfaced — review, edit, approve, send",
  },
  signal_hunter: {
    id: "prospects",
    label: "Prospects",
    subtitle: "leads this agent has surfaced — review, edit, approve, send",
  },
  competitor_watch: {
    id: "competitors",
    label: "Competitors",
    subtitle: "watchlist + the latest weekly digest",
  },
  corporate_event_hunter: {
    id: "leads",
    label: "Leads",
    subtitle: "drafted outreach to companies showing event-booking signals",
  },
};

function tabsForAgent(agentType: string | null) {
  // The workspace tab is the FIRST tab (the natural home for the agent),
  // followed by Timeline, Knowledge, Examples, Connections, Settings.
  const base = [...BASE_TABS];
  if (agentType && WORKSPACE_TAB_BY_TYPE[agentType]) {
    return [WORKSPACE_TAB_BY_TYPE[agentType], ...base];
  }
  return base;
}

function defaultTabFor(agentType: string | null): Tab {
  return (
    (agentType && WORKSPACE_TAB_BY_TYPE[agentType]?.id) ?? "timeline"
  ) as Tab;
}

export default function AgentDetailShell({
  data,
  initialTab,
}: {
  data: AgentDetailData;
  initialTab: Tab | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const agentType =
    typeof (data.agent.config as Record<string, unknown>)?.type === "string"
      ? ((data.agent.config as Record<string, unknown>).type as string)
      : null;
  const TABS = tabsForAgent(agentType);

  const requestedTab = searchParams.get("tab") as Tab | null;
  const fallbackTab = defaultTabFor(agentType);
  const activeTab: Tab = TABS.some((t) => t.id === requestedTab)
    ? (requestedTab as Tab)
    : initialTab && TABS.some((t) => t.id === initialTab)
    ? initialTab
    : fallbackTab;

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
    <div className="console-shell grid grid-cols-[220px_1fr] min-h-screen bg-[#0A1310] text-white">
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
                  <span className="text-xs font-medium text-white/75">
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
            {activeTab === "students" && <StudentsTab data={data} />}
            {activeTab === "prospects" && <ProspectsTab data={data} />}
            {activeTab === "conversations" && <ConversationsTab data={data} />}
            {activeTab === "applicants" && <ApplicantsTab data={data} />}
            {activeTab === "competitors" && <CompetitorsTab data={data} />}
            {activeTab === "leads" && <LeadsTab data={data} />}
            {activeTab === "knowledge" && <KnowledgeTab data={data} />}
            {activeTab === "examples" && <ExamplesTab data={data} />}
            {activeTab === "connections" && <ConnectionsTab data={data} />}
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
      <div className="text-xs font-medium text-white/75">{label}</div>
      <div className={`mt-1 text-base font-semibold ${warn ? "text-[#E8B85E]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
