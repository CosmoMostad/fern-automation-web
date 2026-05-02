import { Sidebar, TopBar } from "@/components/console/Shell";
import CatalogView from "@/components/console/CatalogView";
import { getCatalog } from "@/lib/db/catalog";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const data = await getCatalog();
  return (
    <div className="console-shell min-h-screen bg-[#0A1310] text-white grid grid-cols-[220px_1fr]">
      <Sidebar isDemo={false} />
      <div className="flex flex-col">
        <TopBar
          business={data.org?.name ?? "Fern"}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Catalog" }]}
        />
        <main className="flex-1 overflow-auto">
          <CatalogView entries={data.entries} />
        </main>
      </div>
    </div>
  );
}
