import { redirect } from "next/navigation";

import Dashboard from "@/components/console/Dashboard";
import { getDashboardData } from "@/lib/db/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // never cache; always fetch fresh

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: { demo?: string };
}) {
  const demo = searchParams.demo ?? null;

  // Belt-and-suspenders auth gate. Middleware should already bounce
  // unauthenticated users to /console/login, but on the off chance a
  // platform-specific matcher quirk lets a request slip past (we just hit
  // one on iPad Safari), this server-side check guarantees no
  // unauthenticated session ever sees the misleading "Your business /
  // there" empty fallback.
  if (!demo && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/console/login");
    }
  }

  const data = await getDashboardData({ demo });
  return <Dashboard data={data} demo={demo} />;
}
