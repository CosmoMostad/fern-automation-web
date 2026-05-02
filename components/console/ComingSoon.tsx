import { Sidebar, TopBar } from "./Shell";

/**
 * Reusable placeholder used by routes whose UI is on the roadmap but not
 * yet built. Renders the standard Console chrome so the sidebar stays
 * usable, plus a clear "what this will be" message.
 */
export default function ComingSoon({
  title,
  description,
  business,
  user,
  isDemo = false,
}: {
  title: string;
  description: string;
  business: string;
  user: string;
  isDemo?: boolean;
}) {
  return (
    <div className="console-shell min-h-screen bg-[#0A1310] text-white grid grid-cols-[220px_1fr]">
      <Sidebar isDemo={isDemo} />
      <div className="flex flex-col">
        <TopBar
          business={business}
          user={user}
          isDemo={isDemo}
          breadcrumb={[{ label: title }]}
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-8 py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full border border-white/15 flex items-center justify-center text-white/55">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 6v4l2.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">
              {description}
            </p>
            <p className="mt-4 text-[11px] font-mono uppercase tracking-[0.18em] text-white/35">
              On the roadmap
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
