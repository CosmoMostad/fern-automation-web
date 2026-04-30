import { redirect } from "next/navigation";

import BusinessSettings from "@/components/console/BusinessSettings";
import { getBusinessSettings } from "@/lib/db/business-settings";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const result = await getBusinessSettings();

  if (!result.ok) {
    if (result.reason === "unauthed") redirect("/console/login");
    if (result.reason === "no-org") redirect("/console");
    return (
      <div className="p-10 text-white/70 text-sm">
        Supabase isn&rsquo;t connected yet.
      </div>
    );
  }

  return <BusinessSettings data={result.data} />;
}
