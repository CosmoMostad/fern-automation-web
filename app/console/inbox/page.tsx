import { redirect } from "next/navigation";

import InboxView from "@/components/console/InboxView";
import { getInbox } from "@/lib/db/inbox";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const r = await getInbox();
  if (!r.ok) {
    if (r.reason === "unauthed") redirect("/console/login");
    if (r.reason === "no-org") redirect("/console");
    return (
      <div className="p-10 text-white/70 text-sm">
        Supabase isn&rsquo;t connected yet.
      </div>
    );
  }
  return <InboxView data={r.data} />;
}
