import Link from "next/link";
import TableOfContents, { type TocItem } from "./TableOfContents";

type Props = {
  toc: TocItem[];
  children: React.ReactNode;
};

export default function ProposalLayout({ toc, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-8 pb-5 border-b border-rule">
        <div className="max-w-page mx-auto flex items-baseline justify-between">
          <Link href="/" className="no-underline font-medium tracking-tight">
            fern automation
          </Link>
          <span className="text-sm text-muted">proposal</span>
        </div>
      </header>

      <div className="max-w-page mx-auto w-full px-6 md:px-12 flex-1 grid md:grid-cols-[200px_1fr] gap-10 md:gap-16 py-12 md:py-16">
        <aside className="hidden md:block">
          <TableOfContents items={toc} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>

      <footer className="px-6 md:px-12 py-8 border-t border-rule text-sm text-muted">
        <div className="max-w-page mx-auto flex flex-col md:flex-row md:justify-between gap-2">
          <span>Fern Automation · Seattle</span>
          <a
            href="mailto:cosmo@fernautomation.com"
            className="no-underline hover:underline"
          >
            cosmo@fernautomation.com
          </a>
        </div>
      </footer>
    </div>
  );
}
