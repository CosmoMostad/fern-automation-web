import Dashboard from "@/components/console/Dashboard";
import { getDashboardData } from "@/lib/db/dashboard";

export const dynamic = "force-dynamic"; // never cache; always fetch fresh

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: { demo?: string };
}) {
  const data = await getDashboardData({
    demo: searchParams.demo ?? null,
  });
  return <Dashboard data={data} demo={searchParams.demo ?? null} />;
}
