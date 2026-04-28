export const wscMeta = {
  title: "AI agent pilot at WSC",
  preparedFor: "Cooper Anthony-Mostad",
  date: "April 28, 2026",
  contactEmail: "cosmo@fernautomation.com",
  contactName: "Cosmo Mostad",
};

export const wscLayoutMap = [
  {
    heading: "Tier 1 program",
    items: [
      "1 · Tier 1 Performance onboarding",
      "2 · Tier 1 scheduling and family questions",
      "3 · Tournament reports",
    ],
  },
  {
    heading: "Lead generation",
    items: [
      "4 · Golf class lead finder",
      "5 · Gym lead finder (recommend declining)",
    ],
  },
  {
    heading: "Customer ops",
    items: ["6 · General customer Q&A"],
  },
];

type AgentSpec = {
  id: string;
  title: string;
  /** Always-visible summary line shown when the row is collapsed */
  tail?: string;
  /** Body paragraphs revealed on expand */
  body: string[];
  /** Optional ordered list rendered inside the body (used by Agent #5) */
  reasons?: { title: string; body: string }[];
};

export const wscAgents: AgentSpec[] = [
  {
    id: "agent-1",
    title: "1. Tier 1 Performance onboarding",
    tail: "Connects to the Tier 1 inbox, CourtReserve, the e-sig tool, and the Fern Console · Runs continuously, business hours and after · ~$5–10/month",
    body: [
      "Reads every Tier 1 Performance application as it comes in. Looks at the kid's signals — age, UTR, cross-rally rating, tournaments per month, schooling preference — and applies WSC's class-routing rules to pick the right evaluation class. Drafts a welcoming email walking the family through the next steps: which evaluation class to attend, how to make a CourtReserve account, what to expect on the day. Once the family signs up, confirms via CourtReserve and emails the assigned coach with the kid's context. After the evaluation, the coach enters their accept-or-reject decision in the Console with a few notes; the agent picks it up and drafts the right follow-up — congratulations and paperwork links if accepted, a thoughtful explanation and rec class suggestions if not — and tracks paperwork to completion. Replies arrive in 5–15 minutes during business hours and by 9am the next day after hours, with human-feeling timing. Hands off to a person anytime a parent goes off-script or sounds upset.",
    ],
  },
  {
    id: "agent-2",
    title: "2. Tier 1 scheduling and family questions",
    tail: "Connects to the Tier 1 inbox, CourtReserve, and the Fern Console · Runs continuously · ~$15–25/month",
    body: [
      "Lives on the same Tier 1 inbox and handles every scheduling and ongoing question from enrolled families. For private lessons, looks up the requested coach's published availability against court availability and the kid's history, proposes specific time slots in the reply, and books in CourtReserve once the family confirms — never books unilaterally. For group lessons, applies WSC's eligibility rules and proposes the right options. Handles cancellations, reschedules, and makeups using WSC's stated policy. Answers ongoing questions like \"what time is Tommy's lesson next Tuesday?\" or \"who's coaching the 4pm group?\" — always grounded in CourtReserve data, never invented. Coaches manage their own availability windows in the Console; the agent reads from there. Requires a one-time shift in how coaches schedule privates — from ad-hoc 1-on-1 negotiation to set availability windows. Covered below in *Next Steps & Requirements*.",
    ],
  },
  {
    id: "agent-3",
    title: "3. Tournament reports",
    tail: "Connects to public tournament data sources and the Fern Console · Runs on demand · ~$3–7/month",
    body: [
      "On-demand. A coach opens the Console, finds a kid (or types in a name for a non-roster prospect), and clicks Generate Report. The agent pulls from the tournament sources WSC tells it to watch, gathers the kid's recent matches and historical results, compares against peer cohorts (same age, same UTR), and writes a narrative report covering recent results, opponent quality, surface and pace patterns, and concrete observations the data supports. No generic platitudes — only what's in the data. Saved to the kid's Console card; coach can share a read-only link with the parent.",
    ],
  },
  {
    id: "agent-4",
    title: "4. Golf class lead finder",
    tail: "Connects to public tournament sources, parent enrichment tooling, the WSC golf inbox, and the Fern Console · Runs weekly · ~$40–65/month, including a paid email-discovery service",
    body: [
      "Watches local junior golf tournaments — junior tour events, regional youth tournaments, HS golf, club opens — and surfaces kids who match WSC's \"good fit\" criteria. For each prospect, finds the parent's contact through public sources only: news mentions, public association directories, public-record discovery. No scraping of closed networks. Drafts personalized outreach: who WSC is, where we saw the kid, what we observed (only what's actually in the public record), what we're offering. Every email is reviewed and approved by the head golf person before it sends — no exceptions, no auto-send window, ever. Replies route back into a real conversation with the parent, and the agent drafts follow-ups for approval too. Anyone who asks to be removed is permanently blocklisted within the same business day. Fully CAN-SPAM compliant: clear sender identity, real WSC address, working unsubscribe in every email.",
    ],
  },
  {
    id: "agent-5",
    title: "5. Gym lead finder — requested, with concerns",
    body: [
      "What was requested: an agent that finds women aged 35–45, family of about 3.5, household income $150k+ in the Woodinville area, gets their email addresses, and sends cold outreach about WSC's gym and gym classes.",
      "I recommend not building this one. Four reasons:",
    ],
    reasons: [
      {
        title: "1. The data is hard to get cleanly.",
        body: "Tight individual-level demographic targeting (age + family size + household income + ZIP) requires expensive paid data brokers. Email match rates against tight profiles run 5–15%. Most of the spend produces no usable contacts.",
      },
      {
        title: "2. The legal posture.",
        body: "Cold consumer email is allowed under CAN-SPAM with proper compliance, but unlike the golf outreach there's no \"we saw your kid play in a tournament\" hook. Pure cold demographic targeting reads as spam and triggers additional disclosure obligations under state laws (CCPA, MHMDA).",
      },
      {
        title: "3. The conversion math doesn't pay back.",
        body: "Industry benchmark for cold consumer email is 0.1–0.5% conversion. Out of 1,000 sends you'd expect 1–5 trial signups, of which maybe one becomes a member. Data acquisition + sending + brand cost is greater than the return.",
      },
      {
        title: "4. The brand risk is asymmetric.",
        body: "WSC is a community brand. One annoyed parent posting \"WSC is sending me emails about joining their gym\" in a local Facebook group damages the brand with the exact demographic you're trying to reach.",
      },
    ],
  },
  {
    id: "agent-6",
    title: "6. General customer Q&A",
    tail: "Connects to the general WSC inbox and the Fern Console · Runs continuously · ~$10–18/month",
    body: [
      "Lives on info@woodinvillesportsclub.com — the main WSC inbox. Reads every incoming email and routes it: Tier 1 program emails go to the Tier 1 agents above, complaints and off-script questions escalate to a person, and everything else is general Q&A — hours, pricing, class schedules, location, parking, membership tiers, policies. The agent answers from a knowledge base WSC manages in the Fern Console: structured entries for every fact, edited self-serve by staff. The first round of entries is seeded by scraping the public WSC website plus a 2–3 hour session with whoever knows the club best. If a question can't be answered from the knowledge base, the agent escalates rather than guessing. Over time the knowledge base fills out as escalations reveal gaps.",
    ],
  },
];

export const wscBuildSequence = [
  {
    phase: "Phase 1",
    items: [
      "Agent #6 · General Q&A",
      "Agent #1 · Tier 1 onboarding",
    ],
  },
  {
    phase: "Phase 2",
    items: [
      "Agent #3 · Tournament reports",
      "Agent #4 · Golf lead finder",
    ],
  },
  {
    phase: "Phase 3",
    items: ["Agent #2 · Scheduling and family questions"],
  },
];
