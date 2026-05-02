import { Sidebar, TopBar } from "@/components/console/Shell";
import ProspectsView from "@/components/console/ProspectsView";
import { getProspectsList } from "@/lib/db/prospects";
import type { ProspectStatus } from "@/lib/db/prospects";

export const dynamic = "force-dynamic";

const VALID_STATUSES: (ProspectStatus | "all")[] = [
  "all",
  "discovered",
  "scored",
  "qualified",
  "enriched",
  "drafted",
  "sent",
  "replied",
  "converted",
  "passed",
  "unreachable",
  "unsubscribed",
];

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: { agent?: string; status?: string };
}) {
  const statusFilter = (
    VALID_STATUSES.includes(
      (searchParams.status ?? "all") as ProspectStatus | "all"
    )
      ? (searchParams.status ?? "all")
      : "all"
  ) as ProspectStatus | "all";

  const data = await getProspectsList({
    agentFilter: searchParams.agent ?? null,
    statusFilter,
  });

  return (
    <div className="console-shell min-h-screen bg-[#0A1310] text-white grid grid-cols-[220px_1fr]">
      <Sidebar isDemo={false} />
      <div className="flex flex-col">
        <TopBar
          business={data.org?.name ?? "Fern"}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Prospects" }]}
        />
        <main className="flex-1 overflow-auto">
          <ProspectsView
            prospects={data.prospects}
            statusFilter={data.statusFilter}
          />
        </main>
      </div>
    </div>
  );
}
