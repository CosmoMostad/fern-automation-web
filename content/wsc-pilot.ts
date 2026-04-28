export const wscMeta = {
  title: "AI agent pilot at WSC",
  preparedFor: "Cooper Anthony-Mostad",
  date: "April 28, 2026",
  contactEmail: "cosmo@fernautomation.com",
  contactName: "Cosmo Mostad",
};

export const wscLayoutMap = [
  {
    heading: "Grow & retain",
    items: ["1 · Member retention", "2 · Cross-sport discovery"],
  },
  {
    heading: "New business",
    items: [
      "3 · Event promoter",
      "4 · Corporate event hunter",
      "5 · Member lead finder",
    ],
  },
  {
    heading: "Capture demand",
    items: ["6 · Website chatbot", "7 · Email triage"],
  },
  {
    heading: "Manager intel",
    items: ["8 · Competitor watch"],
  },
];

type AgentSpec = {
  id: string;
  title: string;
  tail: string;
  body: string[];
};

export const wscAgents: AgentSpec[] = [
  {
    id: "agent-1",
    title: "1. Member retention",
    tail: "Connects to CourtReserve and Gmail · Runs daily · ~$3/month",
    body: [
      "Watches check-in and booking data. When a member goes quiet — no visits in three or four weeks — the agent sends a personalized note referencing their sport and what's actually happening at WSC right now (league filling up, a clinic coming, a new demo racket). When it fits, it includes a light offer — free bucket, guest pass, trial lesson — with a one-click path to book.",
    ],
  },
  {
    id: "agent-2",
    title: "2. Cross-sport discovery (tennis & pickleball)",
    tail: "Connects to CourtReserve and Gmail · Runs weekly · ~$3/month",
    body: [
      "Finds tennis-only and pickleball-only members and nudges them to try the other sport — first lesson free, demo hour with a pro, open court trial. Multi-sport members stay longer and spend more, so this is a retention play dressed as growth. Works both directions: pickleball-first members get a tennis hook, tennis-first members get a pickleball hook.",
    ],
  },
  {
    id: "agent-3",
    title: "3. Event promoter",
    tail: "Connects to Gmail and the CourtReserve member list · Runs on demand, plus scheduled follow-ups · $2–5/month",
    body: [
      "Give it an event — a tournament, ladies' night, junior camp, sim league, holiday mixer — and it figures out which members should hear about it, drafts the email tailored to each group, sends at the right time, and handles the reminders. RSVPs come back to one place. Removes the \"we have this great event but nobody knew about it\" problem.",
    ],
  },
  {
    id: "agent-4",
    title: "4. Corporate event hunter",
    tail: "Connects to public news sources and Gmail · Runs a weekly scan · $5–10/month",
    body: [
      "Watches local business signals — Seattle-area funding announcements, executive hires, company milestones, Chamber activity — and flags companies likely to book a team event (corporate golf outing, tennis mixer, sim tournament, end-of-quarter party). Drafts the outreach email for you to review and send. Turns WSC's highest-ticket product line into a proactive pipeline instead of \"whoever happens to find us.\"",
    ],
  },
  {
    id: "agent-5",
    title: "5. Member lead finder",
    tail: "Connects to public community sources, new-mover data, and Gmail · Runs weekly · $6–12/month",
    body: [
      "Finds prospective new members in the WSC catchment — Woodinville, Kirkland, Bothell, Redmond — by watching local signals: people on Nextdoor or Reddit asking about pickleball, tennis lessons for kids, or golf coaching; public posts on local community and parent pages; Google searches with local intent (\"tennis lessons Woodinville\"); new-mover data; school-year program windows.",
      "Each week you get a list of prospects, each with a **drafted personal outreach for you to send from your account** — a comment, a DM, an email. The agent researches and writes; a human sends. That's deliberate: automated posting in closed groups (mom groups, neighborhood groups) violates platform rules and burns goodwill. Done right, this is one GM reaching out to one local because the AI spotted a real signal.",
      "Also drafts targeted Meta/Instagram ad copy — tuned to the mom-and-family demographic in WSC zip codes — for you to approve and run if you want paid reach on top of the organic outreach.",
    ],
  },
  {
    id: "agent-6",
    title: "6. Website chatbot",
    tail: "Connects to the WSC website via one line of code · Runs 24/7 · $5–15/month depending on traffic",
    body: [
      "The WSC site doesn't have one today — this adds a small chat widget that answers the questions people currently have to email or call about: hours, membership pricing, how to book a simulator, guest passes, what Toptracer is, lesson availability. Captures contact info from anyone it can't close and passes them to staff with context.",
    ],
  },
  {
    id: "agent-7",
    title: "7. Email triage",
    tail: "Connects to Gmail · Runs every two minutes · $3–8/month",
    body: [
      "Reads every email arriving at the main WSC inbox, sorts it (inquiry, complaint, booking, vendor, junk), and drops a draft reply in Gmail drafts for staff to review and send. Urgent items get flagged at the top. Cuts the inbox work from an hour to ten minutes most days.",
    ],
  },
  {
    id: "agent-8",
    title: "8. Competitor watch",
    tail: "Connects to a watchlist of competitor sites and social profiles · Runs weekly · $3–6/month",
    body: [
      "Every Monday morning you get a short digest of what other Seattle-area ranges, tennis clubs, pickleball facilities, and gyms are doing — price changes, new promos, events they're running, hours changes, membership tiers, notable social posts. Synthesized into a one-page read, not a data dump. Designed for decisions, not dashboards.",
    ],
  },
];

export const wscValueRows = [
  {
    name: "Member retention",
    math: "1–2 members saved from churn per month = 12–24 memberships retained across the year",
    impact: "$18K–$36K/yr retained",
  },
  {
    name: "Member lead finder",
    math: "2–3 new members per month = 24–36 new memberships in year one",
    impact: "$20K–$30K yr-1, $70K–$110K LTV",
  },
  {
    name: "Corporate event hunter",
    math: "1 additional corporate booking per month at $2K–$4K each",
    impact: "$24K–$48K/yr",
  },
  {
    name: "Event promoter",
    math: "Events filling to 85% instead of 50–60%; ~$500–$1,500 lift per event, 2–4 events/month",
    impact: "$12K–$48K/yr",
  },
  {
    name: "Website chatbot",
    math: "1 membership/month recovered from after-hours site traffic that would have bounced",
    impact: "$18K/yr + staff time",
  },
  {
    name: "Cross-sport discovery",
    math: "3–5 single-sport members per month deepened into dual-sport; adds $25–$50/month per converted member",
    impact: "$5K–$15K/yr",
  },
  {
    name: "Email triage",
    math: "Staff inbox time cut from ~60 min/day to ~10 min/day",
    impact: "~5 hrs/week freed",
  },
  {
    name: "Competitor watch",
    math: "Decision support — informs pricing moves, event timing, membership tier adjustments",
    impact: "Not directly attributable",
  },
];
