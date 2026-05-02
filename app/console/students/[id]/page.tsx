import { Sidebar, TopBar } from "@/components/console/Shell";
import StudentDetail from "@/components/console/StudentDetail";
import { getStudentDetail } from "@/lib/db/students";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getStudentDetail(params.id);
  return (
    <div className="console-shell min-h-screen bg-[#0A1310] text-white grid grid-cols-[220px_1fr]">
      <Sidebar isDemo={false} />
      <div className="flex flex-col">
        <TopBar
          business={data.org?.name ?? "Fern"}
          user={data.user.display_name}
          isDemo={false}
          breadcrumb={[
            { label: "Students", href: "/console/students" },
            { label: data.student?.full_name ?? "Student" },
          ]}
        />
        <main className="flex-1 overflow-auto">
          {data.student ? (
            <StudentDetail student={data.student} reports={data.reports} />
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-12 text-sm text-white/55">
              Student not found.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
