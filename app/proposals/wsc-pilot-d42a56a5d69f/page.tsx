import type { Metadata } from "next";
import ProposalLayout from "@/components/ProposalLayout";
import Hero from "@/components/Hero";
import LayoutMap from "@/components/LayoutMap";
import Accordion from "@/components/Accordion";
import BuildSequence from "@/components/BuildSequence";
import NextSteps from "@/components/NextSteps";
import {
  wscMeta,
  wscLayoutMap,
  wscAgents,
  wscBuildSequence,
} from "@/content/wsc-pilot";

export const metadata: Metadata = {
  title: `${wscMeta.title} — Fern Automation`,
  description: `Proposal for ${wscMeta.preparedFor}, ${wscMeta.date}.`,
  robots: { index: false, follow: false },
};

const toc = [
  { id: "layout", label: "Where the agents plug in" },
  { id: "agents", label: "The six agents" },
  { id: "how", label: "How Fern works" },
  { id: "data", label: "Data and security" },
  { id: "next", label: "Next steps & requirements" },
];

export default function WscPilotPage() {
  return (
    <ProposalLayout toc={toc}>
      <Hero
        title={wscMeta.title}
        preparedFor={wscMeta.preparedFor}
        date={wscMeta.date}
      />

      <section id="layout" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
          Where the agents plug in
        </h2>
        <p className="text-base md:text-lg leading-relaxed mb-8 max-w-prose">
          Six agents, grouped by what they do for the business.
        </p>
        <LayoutMap columns={wscLayoutMap} />
        <p className="text-base md:text-lg leading-relaxed mt-8 max-w-prose">
          Every agent works through a private web portal at{" "}
          <strong>fernautomation.com</strong> — the Fern Console — where WSC
          staff log in to approve drafts, take over any conversation in one
          click, edit the rules each agent follows, and pull reports. Nothing
          sends without human approval in the early weeks. Sensitive types
          like rejection emails and cold outreach stay supervised
          indefinitely. Every action is logged and exportable.
        </p>
      </section>

      <section id="agents" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">
          The six agents
        </h2>
        <Accordion
          items={wscAgents.map((a) => ({
            id: a.id,
            title: a.title,
            tail: a.tail,
            children: (
              <>
                {a.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {a.reasons && (
                  <div className="space-y-3 pt-1">
                    {a.reasons.map((r, i) => (
                      <div key={i}>
                        <p>
                          <strong>{r.title}</strong> {r.body}
                        </p>
                      </div>
                    ))}
                    <p>
                      The work that actually moves this needle is paid
                      advertising plus a landing page that captures inbound
                      interest — better handled by a marketing agency, not by
                      Fern. Sits outside the agent scope.
                    </p>
                  </div>
                )}
                {a.tail && (
                  <p className="text-sm text-muted pt-1">{a.tail}</p>
                )}
              </>
            ),
          }))}
        />
      </section>

      <section id="how" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
          How Fern works behind the scenes
        </h2>
        <div className="space-y-4 text-base md:text-lg leading-relaxed max-w-prose">
          <p>Two layers, one system.</p>
          <p>
            <strong>The agent layer</strong> is code running on Fern's
            servers. The agents reach into the tools WSC already uses — Gmail,
            CourtReserve, the e-sig tool, public web sources — with
            permissioned access, and do the work staff currently do by hand.
            They don't replace any existing tools.
          </p>
          <p>
            <strong>The Console layer</strong> is the private web portal at
            fernautomation.com where staff log in. It's where every drafted
            email waits for approval, every kid in the Tier 1 funnel shows up
            as a card on a pipeline board, every coach manages their
            availability, every tournament report lives, and every prospect
            list is curated. It's also the audit log: every email read, every
            email sent, every decision made, every escalation, fully
            exportable.
          </p>
          <p>
            A few principles are enforced at the code level — not as
            guidelines, but as guarantees:
          </p>
          <p>
            <strong>Nothing fabricated.</strong> Agents only write from
            grounded data. If a fact isn't in the system — a class time, a
            price, a policy, a kid's tournament result — the agent escalates
            rather than guesses. The AI model is wired so it cannot send
            anything that isn't backed by confirmed data.
          </p>
          <p>
            <strong>Always overridable.</strong> Any staffer can take over any
            conversation in one click. The agent stops responding on that
            thread immediately, and can be handed back the same way.
          </p>
          <p>
            <strong>Supervised in the early weeks.</strong> Every drafted
            email lands in the approval queue. After fifty consecutive sends
            of a given draft type with no staff edits, that type begins to
            auto-send. Sensitive types — rejection emails, cold outreach,
            complaint responses — stay supervised forever, by design.
          </p>
        </div>
      </section>

      <section id="data" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
          Data and security
        </h2>
        <div className="space-y-4 text-base md:text-lg leading-relaxed max-w-prose">
          <p>
            WSC owns all of its data. The database that backs the Console is
            provisioned under WSC's ownership from day one — your data lives
            in your infrastructure, not Fern's. The agents read and write to
            it via API. WSC can export everything at any time and delete
            everything at any time.
          </p>
          <p>
            What's in that database is <em>operational</em> state — funnel
            cards for Tier 1 applicants, leads identified by lead-gen agents,
            draft email logs, decision audit trails, knowledge base entries.
            What's <em>not</em> in it is customer-of-record data: signed
            paperwork stays in the e-sig tool, court bookings stay in
            CourtReserve, customer emails stay in WSC's inbox. Fern is the
            connective layer; the systems of record stay the systems of
            record.
          </p>
          <p>
            All data is encrypted at rest and in transit. Access is logged.
            WSC's data is not shared between clients. WSC's data is not used
            to train AI models — not by Fern, not by the model providers Fern
            uses.
          </p>
          <p>
            If WSC ever wants to end the engagement, the off-ramp is clean:
            export everything, hand over admin access to the database,
            archive the Console workspace. No lock-in.
          </p>
        </div>
      </section>

      <section id="next" className="scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
          Next steps & requirements
        </h2>
        <div className="space-y-4 text-base md:text-lg leading-relaxed max-w-prose mb-8">
          <p>
            <strong>Coach scheduling.</strong> Today, coaches negotiate
            private lessons 1-on-1 over email and text. For Agent #2 to save
            real time, coaches set fixed weekly availability windows in the
            Console / CourtReserve (Bellevue Pickleball Club does this if you
            want an example on their website), and students book those
            windows. The agent fills the gaps and handles the back-and-forth.
          </p>
          <p>
            <strong>Content provisioning.</strong> Email and structure set
            up; email templates for golf outreach and general outreach for
            Tier 1 leads coming in. Tier 1 class structuring — the rules for
            which kid goes in which class based on age, UTR, cross-rally
            rating, tournament volume, and schooling preference. Same
            playbook a coach would use, written down so the agent can apply
            it consistently.
          </p>
          <p>
            <strong>Access to the right systems.</strong> API access to
            CourtReserve; an inbox the agents can read and send from for each
            scope (Tier 1, golf, general WSC); the e-sig tool.
          </p>
          <p>
            <strong>Sample emails — anonymized is fine.</strong> 10–20 real
            past email threads per agent type. This is the tone-training
            data. Agents that write like real WSC staff are agents that work;
            agents trained on generic templates aren't.
          </p>
          <p>
            <strong>A point person who owns the relationship.</strong>{" "}
            Someone who can answer questions during the build, approve drafts
            during the supervised phase, and decide when escalations need
            owner attention.
          </p>
        </div>

        <h3 className="text-base md:text-lg font-semibold tracking-tight mb-3">
          Build sequence
        </h3>
        <BuildSequence phases={wscBuildSequence} />

        <div className="mt-12">
          <NextSteps
            email={wscMeta.contactEmail}
            contactName={wscMeta.contactName}
            body={
              <p>
                If this looks right, reply to the email this proposal came in
                on and we'll get the working session scheduled to lock the
                outstanding pieces above.
              </p>
            }
          />
        </div>
      </section>
    </ProposalLayout>
  );
}
