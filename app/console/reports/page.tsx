import ComingSoon from "@/components/console/ComingSoon";
import { getHeaderData } from "@/lib/db/header";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const h = await getHeaderData();
  return (
    <ComingSoon
      title="Reports"
      description="Cross-agent rollups: drafts approved this week, response times, escalation reasons, attributed revenue from prospecting agents. Built on top of the events + agent_runs tables."
      business={h.business}
      user={h.user}
    />
  );
}
