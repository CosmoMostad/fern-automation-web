import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-10 pb-6 border-b border-rule">
        <div className="max-w-page mx-auto flex items-baseline justify-between">
          <Link href="/" className="no-underline font-medium tracking-tight">
            fern automation
          </Link>
          <nav className="text-sm">
            <a
              href="mailto:cosmo@fernautomation.com"
              className="no-underline hover:underline"
            >
              contact
            </a>
          </nav>
        </div>
      </header>

      <section className="flex-1 px-6 md:px-12 py-24">
        <div className="max-w-prose mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">
            We build AI agents for small businesses.
          </h1>

          <div className="space-y-5 text-base md:text-lg leading-relaxed">
            <p>
              Most small businesses run on a handful of inboxes, spreadsheets,
              and tools that almost talk to each other. Fern Automation builds
              the part that's missing — small, focused agents that handle the
              repetitive work between those tools, so the team can spend their
              time on the parts of the business that actually need a human.
            </p>
            <p>
              Each agent is tailored to one business. It runs quietly in the
              background, drafts what needs drafting, watches what needs
              watching, and surfaces only what a person needs to decide on.
              Nothing auto-sends without permission.
            </p>
            <p>
              We're early. Working with a small number of pilot clients in
              Seattle right now. If you run a small business and there's a
              pile of work that feels like it shouldn't be a person's job —{" "}
              <a href="mailto:cosmo@fernautomation.com">get in touch</a>.
            </p>
          </div>
        </div>
      </section>

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
    </main>
  );
}
