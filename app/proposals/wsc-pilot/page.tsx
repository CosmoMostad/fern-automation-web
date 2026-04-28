import type { Metadata } from "next";
import ProposalLayout from "@/components/ProposalLayout";
import Hero from "@/components/Hero";
import LayoutMap from "@/components/LayoutMap";
import Accordion from "@/components/Accordion";
import ValueTable from "@/components/ValueTable";
import NextSteps from "@/components/NextSteps";
import {
  wscMeta,
  wscLayoutMap,
  wscAgents,
  wscValueRows,
} from "@/content/wsc-pilot";

export const metadata: Metadata = {
  title: `${wscMeta.title} — Fern Automation`,
  description: `Proposal for ${wscMeta.preparedFor}, ${wscMeta.date}.`,
  robots: { index: false, follow: false },
};

const toc = [
  { id: "layout", label: "Where the agents plug in" },
  { id: "agents", label: "The eight agents" },
  { id: "value", label: "Expected value" },
  { id: "next", label: "Next steps" },
];

// Tiny inline-bold renderer for **text** in plain strings.
function renderBold(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

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
          Eight agents, grouped by what they do for the business.
        </p>
        <LayoutMap columns={wscLayoutMap} />
      </section>

      <section id="agents" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6">
          The eight agents
        </h2>
        <Accordion
          items={wscAgents.map((a) => ({
            id: a.id,
            title: a.title,
            tail: a.tail,
            children: (
              <>
                {a.body.map((paragraph, i) => (
                  <p key={i}>{renderBold(paragraph)}</p>
                ))}
                <p className="text-sm text-muted pt-1">{a.tail}</p>
              </>
            ),
          }))}
        />
      </section>

      <section id="value" className="mb-16 scroll-mt-12">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
          Expected value
        </h2>
        <p className="text-base md:text-lg leading-relaxed mb-6 max-w-prose">
          Honest answer: we won't know the real number until we run it. Here's
          the arithmetic we'd use to judge the pilot.
        </p>
        <ValueTable
          rows={wscValueRows}
          assumptions={
            <p>
              <strong>Assumptions:</strong> average WSC membership ~$125/month
              ($1,500/year). Member tenure ~2 years (so LTV ~$3,000). Year-one
              measurement window.
            </p>
          }
        />
        <p className="text-base md:text-lg leading-relaxed mt-8 max-w-prose">
          If even half of these land near their conservative end, year-one
          impact is in the <strong>$40K–$80K</strong> range. If several land
          near the upper end, it's materially higher. The pilot month itself
          costs WSC nothing — API costs ($50–$500) are on Fern.
        </p>
      </section>

      <section id="next" className="scroll-mt-12">
        <NextSteps
          email={wscMeta.contactEmail}
          contactName={wscMeta.contactName}
          body={
            <>
              <p>
                Pick the four or five agents you want to run hard for the
                month. We'll get them wired up to your CourtReserve and Gmail
                this week, run them in draft-only mode the whole pilot, and
                check in at the end with what landed.
              </p>
              <p>
                When you're ready, just reply — or call — and we'll set
                kickoff.
              </p>
            </>
          }
        />
      </section>
    </ProposalLayout>
  );
}
