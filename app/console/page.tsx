import Dashboard from "@/components/console/Dashboard";

export default function ConsolePage({
  searchParams,
}: {
  searchParams: { demo?: string };
}) {
  const demo = searchParams.demo ?? null;
  return <Dashboard demo={demo} />;
}
