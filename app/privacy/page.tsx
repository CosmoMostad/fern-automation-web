import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Fern Automation",
  description:
    "What data Fern Automation collects, where it lives, and how to delete it.",
};

const EFFECTIVE_DATE = "2026-05-07";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-8 pb-5 border-b border-rule">
        <div className="max-w-page mx-auto flex items-baseline justify-between">
          <Link href="/" className="no-underline font-medium tracking-tight">
            fern automation
          </Link>
          <span className="text-sm text-muted">privacy</span>
        </div>
      </header>

      <main className="max-w-page mx-auto w-full px-6 md:px-12 py-12 md:py-16 flex-1">
        <article className="max-w-prose">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted mb-10">
            Effective {EFFECTIVE_DATE}.
          </p>

          <p className="text-base leading-relaxed mb-6">
            Fern Automation builds AI agents for small businesses. The agents
            need access to specific business data — emails, customer inquiries,
            contact info, public web pages — to do useful work. This page
            explains what data we collect, where it lives, who else sees it,
            and how to remove it.
          </p>
          <p className="text-base leading-relaxed mb-10">
            Plain language wherever possible. If anything is unclear, email{" "}
            <a href="mailto:cosmo@fernautomation.com" className="underline">
              cosmo@fernautomation.com
            </a>{" "}
            and we'll fix the doc.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Who runs Fern
          </h2>
          <p className="text-base leading-relaxed mb-6">
            Fern Automation is a one-person company based in Seattle, WA, run
            by Cosmo Mostad. There is no parent company, no investors, no
            advertising business. Fern's customers pay Fern directly for agent
            services.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            What data we collect
          </h2>
          <p className="text-base leading-relaxed mb-3">
            Per business that uses Fern:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-base leading-relaxed">
            <li>
              <strong>Account info</strong> — the owner's email address (used
              to sign in via magic link), the business name, and the team
              members the owner invites.
            </li>
            <li>
              <strong>Knowledge documents</strong> — whatever the business
              types or pastes into the Knowledge tab of each agent (FAQs,
              policies, voice guidelines). The business owns this content; we
              store it so the agents can ground their replies on it.
            </li>
            <li>
              <strong>OAuth tokens</strong> for any connected service (Gmail,
              CourtReserve, etc.). Refresh tokens are encrypted with
              AES-256-GCM at rest. Only the agent runtime can decrypt them at
              call time.
            </li>
            <li>
              <strong>Inbound emails</strong> that arrive in the connected
              inbox while an agent is configured to watch it. The agent reads
              these to classify and draft replies. We store the parsed text
              and Gmail message ID for de-duplication.
            </li>
            <li>
              <strong>Drafted replies and outbound emails</strong> the agent
              generates. These sit in the Console waiting for human approval
              before anything is sent.
            </li>
            <li>
              <strong>Run + event logs</strong> — what each agent did and
              when. Used to show the Timeline tab and to debug.
            </li>
            <li>
              <strong>Public web data</strong> agents scrape from URLs you
              configure (e.g., AJGA tournament results, USTA player profiles).
              We store summaries of relevant entries.
            </li>
          </ul>
          <p className="text-base leading-relaxed mb-6">
            We do not collect cookies for tracking or advertising. Vercel sets
            functional cookies for sign-in sessions; that's it.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Where the data lives
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-base leading-relaxed">
            <li>
              <strong>Supabase</strong> (Postgres in US-West, Oregon) — primary
              database. Holds accounts, agents, knowledge, messages, runs,
              events, encrypted OAuth tokens. Multi-tenant isolation enforced
              with row-level security.
            </li>
            <li>
              <strong>Hetzner</strong> (Ubuntu VM in Oregon) — Python agent
              runtime. Reads from Supabase to do its work. Stores no
              customer data on local disk.
            </li>
            <li>
              <strong>Vercel</strong> (US edge) — hosts the web Console at
              fernautomation.com. Serves pages, handles auth callbacks. Does
              not store customer data; reads from Supabase per request.
            </li>
          </ul>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Third parties we share data with
          </h2>
          <p className="text-base leading-relaxed mb-3">
            For Fern to work, parts of your data are sent to these processors:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-base leading-relaxed">
            <li>
              <strong>Anthropic</strong> — for every LLM call. The prompt
              (which can include parts of incoming emails, knowledge docs, and
              draft outputs) is sent to Anthropic's Claude API, processed,
              returned. Anthropic does not train on customer data sent via
              their API.
            </li>
            <li>
              <strong>Google</strong> — when an agent reads or drafts Gmail.
              We only send and receive data on the user's behalf using the
              OAuth scopes the user granted.
            </li>
            <li>
              <strong>Resend</strong> — for sending magic-link sign-in emails
              from the Console. Only the recipient address and the link.
            </li>
          </ul>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            How long we keep data
          </h2>
          <p className="text-base leading-relaxed mb-6">
            For the lifetime of the account, plus a 30-day grace window after
            cancellation in case you change your mind. After that, data is
            deleted on a rolling basis. If you want everything deleted
            immediately, email{" "}
            <a href="mailto:cosmo@fernautomation.com" className="underline">
              cosmo@fernautomation.com
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Your controls
          </h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-base leading-relaxed">
            <li>
              <strong>Disconnect any agent's Gmail</strong> in the Console —
              the encrypted refresh token is wiped from our database
              immediately. The agent stops being able to read or draft.
            </li>
            <li>
              <strong>Revoke Fern's Google access entirely</strong> at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                myaccount.google.com/permissions
              </a>
              . The next agent run will fail cleanly with a "not connected"
              error.
            </li>
            <li>
              <strong>Export your data</strong> — email Fern, we'll send you a
              dump of every row tagged to your org.
            </li>
            <li>
              <strong>Delete your account</strong> — same channel; we'll wipe
              within 7 days and confirm.
            </li>
          </ul>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Security
          </h2>
          <p className="text-base leading-relaxed mb-6">
            OAuth refresh tokens are encrypted with AES-256-GCM at rest. The
            encryption key lives in Vercel and Hetzner environment variables,
            not in the database. Postgres connections are TLS. The Hetzner
            machine has no public web ports — it pulls from Supabase, never
            accepts inbound web traffic. Each agent's source code lists the
            specific external operations it can perform; anything not on the
            list isn't reachable from agent code.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Updates
          </h2>
          <p className="text-base leading-relaxed mb-6">
            If we change anything material here, we'll email account owners
            and update the effective date at the top of this page.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Contact
          </h2>
          <p className="text-base leading-relaxed mb-6">
            <a href="mailto:cosmo@fernautomation.com" className="underline">
              cosmo@fernautomation.com
            </a>
            .
          </p>
        </article>
      </main>

      <footer className="px-6 md:px-12 py-8 border-t border-rule text-sm text-muted">
        <div className="max-w-page mx-auto flex flex-col md:flex-row md:justify-between gap-2">
          <span>Fern Automation · Seattle</span>
          <Link href="/terms" className="no-underline hover:underline">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
