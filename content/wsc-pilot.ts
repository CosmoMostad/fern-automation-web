export const wscMeta = {
  title: "Controlled fast-launch pilot at WSC",
  preparedFor: "Cooper Anthony-Mostad",
  date: "April 28, 2026",
  contactEmail: "cosmo@fernautomation.com",
  contactName: "Cosmo Mostad",
};

export const wscLayoutMap = [
  {
    heading: "Live first (Phase 1)",
    items: [
      "1 · General customer Q&A",
      "2 · Tier 1 onboarding",
      "3 · Tournament reports",
    ],
  },
  {
    heading: "Lead generation (Phase 2)",
    items: ["4 · Golf class lead finder"],
  },
  {
    heading: "Scheduling (Phase 3)",
    items: ["5 · Tier 1 scheduling and family questions"],
  },
];

type AgentSpec = {
  id: string;
  title: string;
  /** Always-visible summary line shown when the row is collapsed */
  tail?: string;
  /** Body paragraphs revealed on expand */
  body: string[];
};

export const wscAgents: AgentSpec[] = [
  {
    id: "agent-1",
    title: "1. General customer Q&A",
    tail: "Connects to the general WSC inbox and the Fern Console · Runs continuously · ~$10–18/month in token costs",
    body: [
      "Lives on info@woodinvillesportsclub.com — the main WSC inbox. Reads every incoming email and routes it: Tier 1 program emails go to the Tier 1 agents, complaints and off-script questions escalate to a person, and everything else is general Q&A — hours, pricing, class schedules, location, parking, membership tiers, policies. The agent answers from a knowledge base WSC manages in the Fern Console: structured entries for every fact, edited self-serve by staff. The first round of entries is seeded by scraping the public WSC website plus a 2–3 hour session with whoever knows the club best. If a question can't be answered from the knowledge base, the agent escalates rather than guesses. Over time the knowledge base fills out as escalations reveal gaps. Accuracy here is a function of how complete WSC's knowledge base entries are — the more we feed it, the sharper it gets.",
    ],
  },
  {
    id: "agent-2",
    title: "2. Tier 1 Performance onboarding",
    tail: "Connects to the Tier 1 inbox, CourtReserve, the e-sig tool, and the Fern Console · Runs continuously, business hours and after · ~$5–10/month in token costs",
    body: [
      "Reads every Tier 1 Performance application as it comes in. Looks at the kid's signals — age, UTR, cross-rally rating, tournaments per month, schooling preference — and applies WSC's class-routing rules to pick the right evaluation class. Drafts a welcoming email walking the family through the next steps: which evaluation class to attend, how to make a CourtReserve account, what to expect on the day. Once the family signs up, confirms via CourtReserve and emails the assigned coach with the kid's context. After the evaluation, the coach enters their accept-or-reject decision in the Console with a few notes; the agent picks it up and drafts the right follow-up — congratulations and paperwork links if accepted, a thoughtful explanation and rec class suggestions if not — and tracks paperwork to completion. Replies arrive in 5–15 minutes during business hours and by 9am the next day after hours, with human-feeling timing. Hands off to a person anytime a parent goes off-script or sounds upset.",
    ],
  },
  {
    id: "agent-3",
    title: "3. Tournament reports",
    tail: "Connects to public tournament data sources and the Fern Console · Runs on demand · ~$3–7/month in token costs",
    body: [
      "On-demand. A coach opens the Console, finds a kid (or types in a name for a non-roster prospect), and clicks Generate Report. The agent pulls from the tournament sources WSC tells it to watch, gathers the kid's recent matches and historical results, compares against peer cohorts (same age, same UTR), and writes a narrative report covering recent results, opponent quality, surface and pace patterns, and concrete observations the data supports. No generic platitudes — only what's in the data. Saved to the kid's Console card; coach can share a read-only link with the parent. This one is the simplest of the three Phase 1 agents — it reads public data, runs on demand, and has no outbound email risk.",
    ],
  },
  {
    id: "agent-4",
    title: "4. Golf class lead finder",
    tail: "Connects to public tournament sources, parent enrichment tooling, the WSC golf inbox, and the Fern Console · Runs weekly · ~$40–65/month including a paid email-discovery service",
    body: [
      "Watches local junior golf tournaments — junior tour events, regional youth tournaments, HS golf, club opens — and surfaces kids who match WSC's \"good fit\" criteria. For each prospect, finds the parent's contact through public sources only: news mentions, public association directories, public-record discovery. No scraping of closed networks. Drafts personalized outreach: who WSC is, where we saw the kid, what we observed (only what's actually in the public record), what we're offering. Every email is reviewed and approved by the head golf person before it sends — no exceptions, no auto-send window, ever. Replies route back into a real conversation with the parent, and the agent drafts follow-ups for approval too. Anyone who asks to be removed is permanently blocklisted within the same business day. Fully CAN-SPAM compliant: clear sender identity, real WSC address, working unsubscribe in every email. This one ships in Phase 2, after we've locked the access list, the approval workflow, and the head golf person's review cadence.",
    ],
  },
  {
    id: "agent-5",
    title: "5. Tier 1 scheduling and family questions",
    tail: "Connects to the Tier 1 inbox, CourtReserve, and the Fern Console · Runs continuously · ~$15–25/month in token costs",
    body: [
      "Lives on the same Tier 1 inbox and handles every scheduling and ongoing question from enrolled families. For private lessons, looks up the requested coach's published availability against court availability and the kid's history, proposes specific time slots in the reply, and books in CourtReserve once the family confirms — never books unilaterally. For group lessons, applies WSC's eligibility rules and proposes the right options. Handles cancellations, reschedules, and makeups using WSC's stated policy. Answers ongoing questions like \"what time is Tommy's lesson next Tuesday?\" or \"who's coaching the 4pm group?\" — always grounded in CourtReserve data, never invented. Coaches manage their own availability windows in the Console; the agent reads from there. Requires a one-time shift in how coaches schedule privates — from ad-hoc 1-on-1 negotiation to set availability windows. That operational shift is the gating item; the agent itself is straightforward to build. Lands in Phase 3 once coaches are bought in and availability windows are populated.",
    ],
  },
];

export const wscRoadmap = [
  {
    phase: "Phase 1 — live in 3–4 weeks",
    summary:
      "Three agents that need the least access, carry the least risk, and let WSC see real value fastest.",
    deliverables: [
      "Agent #1 General Q&A on the main WSC inbox, supervised mode",
      "Agent #2 Tier 1 onboarding on the Tier 1 inbox, supervised mode",
      "Agent #3 Tournament reports available on-demand in the Console",
      "Fern Console live with approval queue, audit log, and one-click human takeover",
      "Knowledge base seeded from the public website + a 2–3 hour session with whoever knows WSC best",
    ],
  },
  {
    phase: "Phase 2 — live in 6–8 weeks (gated on golf access)",
    summary:
      "Outbound golf lead generation, every email approved by the head golf person before it sends.",
    deliverables: [
      "Agent #4 Golf lead finder, weekly run, 100% human-approved outbound",
      "Email-discovery tooling provisioned, blocklist + unsubscribe wired in",
      "Head golf person trained on the approval flow",
    ],
  },
  {
    phase: "Phase 3 — live in 8–12 weeks (gated on coach availability windows)",
    summary:
      "Scheduling automation, once coaches publish weekly availability windows in CourtReserve.",
    deliverables: [
      "Agent #5 Tier 1 scheduling on the Tier 1 inbox, supervised then graduated",
      "Coach availability windows live in CourtReserve / Console for every coach taking privates",
    ],
  },
];

export const wscRisks = [
  {
    title: "1. The agent says something wrong.",
    body: "Controlled by: agents only respond from approved sources (WSC's knowledge base, CourtReserve, public tournament data); when a fact isn't there, the agent escalates instead of guessing. Every drafted email lands in the approval queue for the supervised launch period. Sensitive types — rejection emails, cold outreach, complaint responses — stay supervised forever. Accuracy is a function of how complete the knowledge base is; we tighten it as escalations reveal gaps.",
  },
  {
    title: "2. A real situation gets handled like a routine one.",
    body: "Controlled by: any drafted reply that contains escalation triggers (upset tone, off-script question, refund/legal/safety language, parent going off-script) is routed to a human, not auto-sent. Any staffer can take over any conversation in one click; the agent stops responding on that thread immediately.",
  },
  {
    title: "3. Compliance or brand exposure on outbound.",
    body: "Controlled by: outbound (golf lead gen) is 100% human-approved, every email, indefinitely. Public sources only — no scraping of closed networks. CAN-SPAM compliant headers and unsubscribe in every email. Anyone who asks to be removed is blocklisted within the same business day. Full audit log, exportable.",
  },
];

export const wscDecisions = [
  "Lock the Phase 1 inboxes the agents will read and send from (general WSC + Tier 1).",
  "Identify the point person who owns the relationship — answers questions during build, approves drafts during the supervised phase, decides when escalations need owner attention.",
  "Schedule the 2–3 hour knowledge-base session with whoever knows WSC best.",
  "Confirm WSC is willing to ship the coach-availability shift in Phase 3 (or pull Agent #5 from scope).",
  "Approve API access to CourtReserve and the e-sig tool.",
];

export const wscCosts = {
  build:
    "Build cost: $0. Fern is early. We'd rather absorb the build cost and learn alongside WSC on a real pilot than charge for a system that's still proving itself.",
  monthly:
    "Monthly cost (Phase 1, three agents live): roughly $20–40/month, all token costs paid through to the AI provider. Marked clearly as token costs.",
  outside:
    "Outside tooling (Phase 2 only): paid email-discovery service for the golf lead finder, roughly $30–50/month. No outside tooling required for Phase 1.",
  infra:
    "Infrastructure: WSC pays for its own database hosting (commodity Postgres on Hetzner or equivalent, roughly $10–20/month). WSC owns the data; Fern is the connective layer.",
};
