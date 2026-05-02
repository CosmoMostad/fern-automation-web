import { notFound, redirect } from "next/navigation";

import AgentDetailShell from "@/components/console/AgentDetailShell";
import { getAgentDetail } from "@/lib/db/agent-detail";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const result = await getAgentDetail(params.id);

  if (!result.ok) {
    if (result.reason === "unauthed") redirect("/console/login");
    if (result.reason === "not-found") notFound();
    // not-configured: show a helpful empty page instead of a 500
    return (
      <div className="p-10 text-white/70 text-sm">
        Supabase isn&rsquo;t connected yet. Set NEXT_PUBLIC_SUPABASE_URL and
        the anon/service-role keys, then reload this page.
      </div>
    );
  }

  // No default — let AgentDetailShell pick the right landing tab for
  // the agent type (its workspace tab if it has one, else timeline).
  const tab = (searchParams.tab ?? null) as
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
    | "settings"
    | null;

  return <AgentDetailShell data={result.data} initialTab={tab} />;
}
