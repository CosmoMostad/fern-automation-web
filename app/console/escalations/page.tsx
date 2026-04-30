import { redirect } from "next/navigation";

import EscalationsView from "@/components/console/EscalationsView";
import { getEscalations } from "@/lib/db/escalations";

export const dynamic = "force-dynamic";

export default async function EscalationsPage() {
  const r = await getEscalations();
  if (!r.ok) {
    if (r.reason === "unauthed") redirect("/console/login");
    if (r.reason === "no-org") redirect("/console");
    return (
      <div className="p-10 text-white/70 text-sm">
        Supabase isn&rsquo;t connected yet.
      </div>
    );
  }
  return <EscalationsView data={r.data} />;
}
