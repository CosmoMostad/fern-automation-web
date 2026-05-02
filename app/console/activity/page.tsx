import ComingSoon from "@/components/console/ComingSoon";
import { getHeaderData } from "@/lib/db/header";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const h = await getHeaderData();
  return (
    <ComingSoon
      title="Activity feed"
      description="A cross-agent, real-time stream of every event your agents fire — drafts, sends, escalations, errors. Today these events live in each agent's Timeline tab; this view will pool them into one feed with filters."
      business={h.business}
      user={h.user}
    />
  );
}
