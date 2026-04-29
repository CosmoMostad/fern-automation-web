import Link from "next/link";
import { DemoProvider } from "@/components/DemoProvider";
import SiteHeader from "@/components/SiteHeader";
import { SiteFooter } from "@/components/PricingPilotFooter";

export const metadata = {
  title: "Notes — Fern Automation",
  description:
    "Build logs from Fern Automation. What I'm shipping, what's working, what isn't.",
};

export default function NotesIndex() {
  return (
    <DemoProvider>
      <main className="min-h-screen flex flex-col">
        <SiteHeader variant="light" />

        <section className="flex-1 px-6 md:px-10 pt-32 pb-24">
          <div className="max-w-page mx-auto">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fern-700">
              Notes
            </p>
            <h1 className="mt-5">Build logs.</h1>
            <div className="mt-6 space-y-5 text-lg leading-relaxed max-w-prose">
              <p>
                Short, dated write-ups of what I&rsquo;m actually building —
                what worked, what didn&rsquo;t, what changed my mind. Less
                marketing, more lab notebook.
              </p>
              <p>
                First entry lands when the WSC pilot agents start running in
                the wild. Until then, this page is honest about being empty.
              </p>
            </div>

            <div className="mt-12 border border-dashed border-fern-300 rounded-2xl p-10 bg-fern-100 text-center">
              <p className="text-[10px] font-mono uppercase tracking-wider text-fern-700">
                No entries yet
              </p>
              <p className="mt-3 text-muted">First post: late May 2026.</p>
            </div>

            <p className="mt-12">
              <Link href="/">← back home</Link>
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>
    </DemoProvider>
  );
}
