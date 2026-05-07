import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Fern Automation",
  description:
    "The agreement between Fern Automation and the businesses that use it.",
};

const EFFECTIVE_DATE = "2026-05-07";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-8 pb-5 border-b border-rule">
        <div className="max-w-page mx-auto flex items-baseline justify-between">
          <Link href="/" className="no-underline font-medium tracking-tight">
            fern automation
          </Link>
          <span className="text-sm text-muted">terms</span>
        </div>
      </header>

      <main className="max-w-page mx-auto w-full px-6 md:px-12 py-12 md:py-16 flex-1">
        <article className="max-w-prose">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-muted mb-10">
            Effective {EFFECTIVE_DATE}.
          </p>

          <p className="text-base leading-relaxed mb-10">
            These terms cover the agreement between Fern Automation and the
            businesses that use it ("you"). They're written plainly. If
            anything here is unclear or you'd like a custom written agreement
            for your engagement, email{" "}
            <a href="mailto:cosmo@fernautomation.com" className="underline">
              cosmo@fernautomation.com
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            What Fern provides
          </h2>
          <p className="text-base leading-relaxed mb-6">
            Software services for running AI agents tailored to your business.
            Specifically: a hosted Console at fernautomation.com where you
            sign in, connect your tools (Gmail, etc.), enter knowledge, and
            review/approve agent output. The agents themselves run on Fern's
            servers.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Pilot vs. paid status
          </h2>
          <p className="text-base leading-relaxed mb-6">
            Fern is early. Engagements typically begin with a free pilot to
            validate the agents work for your specific business. If we move
            forward into a paid arrangement, the pricing and scope are agreed
            in writing (email is fine) before any charges.
          </p>
          <p className="text-base leading-relaxed mb-6">
            During a pilot, Fern absorbs API and infrastructure costs. There
            are no monthly fees and no contractual lock-in. You can stop the
            pilot at any time by emailing us; we'll disconnect the agents
            within 24 hours.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            What Fern does with your data
          </h2>
          <p className="text-base leading-relaxed mb-6">
            See the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . Short version: we store the minimum needed to make the agents
            work, encrypt sensitive credentials at rest, send some data to
            Anthropic and Google to do LLM and email work, and delete
            everything when you ask.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Acceptable use
          </h2>
          <p className="text-base leading-relaxed mb-3">
            You agree not to use Fern to:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-base leading-relaxed">
            <li>send spam or unsolicited bulk messages</li>
            <li>impersonate other people or organizations</li>
            <li>violate any applicable laws (CAN-SPAM, GDPR, etc.) or the
              terms of any connected service (Google's Gmail terms,
              specifically)
            </li>
            <li>scrape data from sources that prohibit it in their robots.txt or terms</li>
            <li>fabricate testimonials, reviews, or astroturf in closed communities</li>
          </ul>
          <p className="text-base leading-relaxed mb-6">
            If we discover misuse, we may suspend the account immediately and
            notify you. Persistent violations end the engagement.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Approval model
          </h2>
          <p className="text-base leading-relaxed mb-6">
            By default, every outbound message any agent generates is drafted
            and held for human approval in the Console before it sends. You
            can change this per agent in Settings if you want
            higher-autonomy modes — but the default is human-approves-everything,
            and we recommend keeping it on while you're learning what each
            agent says.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Liability
          </h2>
          <p className="text-base leading-relaxed mb-6">
            Fern provides the service "as is." We work hard to keep the
            agents accurate, on-brand, and reliable, but LLMs occasionally
            produce wrong or off-tone output. The approval model is the
            primary safeguard — humans review before sending. You're
            responsible for what your agents send under your business's
            name.
          </p>
          <p className="text-base leading-relaxed mb-6">
            Total liability is limited to fees paid to Fern in the prior
            12 months (which during a pilot is zero). Fern is not liable for
            indirect, consequential, or incidental damages.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Termination
          </h2>
          <p className="text-base leading-relaxed mb-6">
            Either party may end the engagement at any time, by email. On
            termination Fern stops billing immediately, disconnects all
            agents from your services, and deletes your data on the schedule
            in the Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Disputes
          </h2>
          <p className="text-base leading-relaxed mb-6">
            Governed by Washington state law. Disputes are resolved by
            informal negotiation first; if unresolved, by binding
            arbitration in King County, Washington. Both sides waive class
            action. Customers may opt out of arbitration in writing within
            30 days of agreeing to these terms.
          </p>

          <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">
            Updates
          </h2>
          <p className="text-base leading-relaxed mb-6">
            If we change anything material here, we'll email account
            owners and update the effective date at the top of this page.
            Continued use after the change constitutes acceptance.
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
          <Link href="/privacy" className="no-underline hover:underline">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
