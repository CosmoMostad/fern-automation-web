import { Sidebar, TopBar } from "@/components/console/Shell";
import StudentsList from "@/components/console/StudentsList";
import { getStudentsList } from "@/lib/db/students";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const data = await getStudentsList({ query: searchParams.q ?? "" });
  return (
    <div className="console-shell min-h-screen bg-[#0A1310] text-white grid grid-cols-[220px_1fr]">
      <Sidebar isDemo={false} />
      <div className="flex flex-col">
        <TopBar
          business={data.org?.name ?? "Fern"}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[{ label: "Students" }]}
        />
        <main className="flex-1 overflow-auto">
          <StudentsList students={data.students} initialQuery={data.query} />
        </main>
      </div>
    </div>
  );
}
