import type { Metadata } from "next";
import ProposalLayout from "@/components/ProposalLayout";
import Hero from "@/components/Hero";
import LayoutMap from "@/components/LayoutMap";
import Accordion from "@/components/Accordion";
import NextSteps from "@/components/NextSteps";
import {
  wscMeta,
  wscLayoutMap,
  wscAgents,
  wscRoadmap,
  wscRisks,
  wscCosts,
} from "@/content/wsc-pilot";

export const metadata: Metadata = {
  title: `${wscMeta.title} — Fern Automation`,
  description: `Proposal for ${wscMeta.preparedFor}, ${wscMeta.date}.`,
  robots: { index: false, follow: false },
};

const toc = [
  { id: "layout", label: "Where the agents plug in" },
  { id: "agents", label: "The five agents" },
  { id: "roadmap", label: "Launch roadmap" },
  { id: "risks", label: "Top risks at launch" },
  { id: "how", label: "How Fern works" },
  { id: "cost", label: "Cost" },
  { id: "data", label: "Data and security" },
  { id: "next", label: "Next steps" },
];

export default function WscPilotPage() {
  return (
    <ProposalLayout toc={toc}>
      <Hero
        title={wscMeta.title}
        preparedFor={wscMeta.preparedFor}
        date={wscMeta.date}
        intro="A controlled fast-launch pilot. Ship three agents in three to four weeks, keep humans in the loop on every outbound message, measure what breaks in real usage, and tighten the system as we go. Two more agents follow in Phase 2 and Phase 3 once the gating items are in place."
      />

      <section id="layout" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
          Where the agents plug in
        </h2>
        <p className="text-base md:text-lg leading-relaxed mb-8 max-w-prose">
          Five agents, grouped by launch phase.
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
          The five agents
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
                {a.tail && (
                  <p className="text-sm text-muted pt-1">{a.tail}</p>
                )}
              </>
            ),
          }))}
        />
      </section>

      <section id="roadmap" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
          Launch roadmap
        </h2>
        <p className="text-base md:text-lg leading-relaxed max-w-prose mb-8">
          Realistic timelines from the day WSC approves the pilot. Each phase
          ships independently — Phase 2 and 3 are gated on operational items
          WSC controls, not on the agent build.
        </p>
        <div className="space-y-8">
          {wscRoadmap.map((phase, i) => (
            <div
              key={i}
              className="border-t-2 border-fern pt-5 max-w-prose"
            >
              <h3 className="text-xs uppercase tracking-[0.16em] font-semibold text-fern mb-3">
                {phase.phase}
              </h3>
              <p className="text-base md:text-lg leading-relaxed mb-4">
                {phase.summary}
              </p>
              <ul className="space-y-1.5 text-sm md:text-base leading-snug list-disc pl-5">
                {phase.deliverables.map((d, j) => (
                  <li key={j}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="risks" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
          Top risks at launch
        </h2>
        <p className="text-base md:text-lg leading-relaxed max-w-prose mb-6">
          The three risks that matter most, and the controls that hold them.
        </p>
        <div className="space-y-5 max-w-prose">
          {wscRisks.map((r, i) => (
            <div key={i}>
              <p className="text-base md:text-lg leading-relaxed">
                <strong>{r.title}</strong> {r.body}
              </p>
            </div>
          ))}
        </div>
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
            <strong>Grounded responses only.</strong> Agents are designed to
            respond from approved sources — WSC's knowledge base, CourtReserve,
            public tournament data — and to escalate when the answer isn't
            there, rather than guessing. Accuracy is directly a function of
            how complete those approved sources are; the more WSC feeds the
            knowledge base, the sharper the responses get. The system is
            designed to err toward escalation, not improvisation.
          </p>
          <p>
            <strong>Always overridable.</strong> Any staffer can take over any
            conversation in one click. The agent stops responding on that
            thread immediately, and can be handed back the same way.
          </p>
          <p>
            <strong>Supervised in the early weeks.</strong> Every drafted
            email lands in the approval queue. WSC decides — when comfort and
            track record are there — which draft types to graduate to
            auto-send and on what cadence. Sensitive types like rejection
            emails, cold outreach, and complaint responses stay supervised
            forever, by design.
          </p>
        </div>
      </section>

      <section id="cost" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
          Cost
        </h2>
        <div className="space-y-4 text-base md:text-lg leading-relaxed max-w-prose">
          <p>{wscCosts.monthly}</p>
          <p>{wscCosts.outside}</p>
          <p>{wscCosts.infra}</p>
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
        <NextSteps
          email={wscMeta.contactEmail}
          contactName={wscMeta.contactName}
          body={
            <p>
              If this looks right, reply to the email this proposal came in
              on and we'll get the working session scheduled to kick off the
              Phase 1 build.
            </p>
          }
        />
      </section>
    </ProposalLayout>
  );
}
