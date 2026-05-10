/**
 * Agent manifests — single source of truth for what every agent type needs
 * to run, what connections appear in the Connections tab, and what tools
 * the agent is permitted to invoke.
 *
 * One manifest per agent type. Used by:
 *   - Connections tab (renders fields from manifest.connections)
 *   - Preflight validator (checks required fields + knowledge before Run)
 *   - Security panel in agent detail (renders allowed/mutating tool lists)
 *
 * Adding a new agent type:
 *   1. Add an entry to MANIFESTS keyed by the type slug (matches
 *      agent_types.key and agents.config.type).
 *   2. List every required connection field with `required: true`.
 *   3. List required knowledge docs by scope ("org" or "agent").
 *   4. Declare allowedTools — every external operation the agent
 *      is permitted to perform. The Python side keeps an authoritative
 *      copy; this is the user-facing copy shown in the security panel.
 *   5. Mark mutating tools (the ones that need approval) in mutatingTools.
 */

export type ConnectionFieldKind =
  | "oauth_gmail"
  | "secret"
  | "text"
  | "url_list";

export type ConnectionField = {
  /** Dotted path inside agent.config (e.g. "gmail.account") */
  path: string;
  label: string;
  kind: ConnectionFieldKind;
  help?: string;
  placeholder?: string;
  /** If true, preflight blocks Run until this is set. */
  required?: boolean;
};

export type ConnectionSection = {
  title: string;
  description?: string;
  fields: ConnectionField[];
};

export type KnowledgeRequirement = {
  /** "org" = shared across all agents in the org, "agent" = scoped to this agent */
  scope: "org" | "agent";
  /** Human-readable label shown in preflight error */
  label: string;
  /** Optional hint about what the doc should contain */
  hint?: string;
  /** Minimum doc count required to satisfy. Default 1. */
  minDocs?: number;
};

export type AgentManifest = {
  /** Matches agent_types.key and agents.config.type */
  type: string;
  label: string;
  category: "customer_ops" | "lead_generation" | "analytics" | "workflow";
  triggerKind: "cron" | "inbound" | "on_demand";

  /** Sections rendered in the Connections tab. Required fields drive preflight. */
  connections: ConnectionSection[];

  /** Knowledge docs the agent needs to do its job. */
  requiredKnowledge?: KnowledgeRequirement[];

  /** Every external operation this agent is permitted to invoke.
   *  The authoritative enforcement lives in agents/<type>/tools.py on Hetzner.
   *  This list is shown in the Security panel so clients can read it. */
  allowedTools: string[];

  /** Subset of allowedTools that mutate external state.
   *  These always go through the approval flow regardless of trust mode. */
  mutatingTools: string[];
};

// ─── Manifests ─────────────────────────────────────────────────────────────
// Order: WSC demo agents first (customer_qa, enrollment_funnel,
// tournament_reports, golf_lead_finder), then other built agents.

export const MANIFESTS: Record<string, AgentManifest> = {
  customer_qa: {
    type: "customer_qa",
    label: "Customer Q&A",
    category: "customer_ops",
    triggerKind: "inbound",
    connections: [
      {
        title: "Gmail",
        description: "Inbox the agent watches and the address it replies from.",
        fields: [
          {
            path: "gmail.account",
            label: "Inbox address",
            kind: "oauth_gmail",
            required: true,
            help: "Authorize Fern to read this inbox and create drafts.",
          },
          {
            path: "gmail.reply_to",
            label: "Reply-to override",
            kind: "text",
            placeholder: "Leave empty to reply from the inbox above",
            help: "Optional. If set, replies use this address.",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "org",
        label: "Business overview & policies",
        hint: "What you offer, hours, prices, refund/cancellation rules — the agent grounds every reply in these docs.",
      },
    ],
    allowedTools: [
      "gmail.read_inbox",
      "gmail.read_thread",
      "gmail.draft_reply",
      "knowledge.search",
      "llm.classify",
      "llm.generate",
    ],
    mutatingTools: ["gmail.draft_reply"],
  },

  enrollment_funnel: {
    type: "enrollment_funnel",
    label: "Enrollment Funnel",
    category: "customer_ops",
    triggerKind: "inbound",
    connections: [
      {
        title: "Gmail",
        description: "Program inbox the agent watches.",
        fields: [
          {
            path: "gmail.account",
            label: "Inbox address",
            kind: "oauth_gmail",
            required: true,
          },
        ],
      },
      {
        title: "CourtReserve",
        description:
          "Used to confirm evaluation-class signups + look up coach availability.",
        fields: [
          {
            path: "courtreserve.api_url",
            label: "API base URL",
            kind: "url_list",
            placeholder: "https://app.courtreserve.com/api/...",
            help: "Single URL — use the URL list field for one entry.",
          },
          {
            path: "courtreserve.api_key",
            label: "API key",
            kind: "secret",
            help: "Stored encrypted; never shown in plain text after save.",
          },
        ],
      },
      {
        title: "Polling",
        fields: [
          {
            path: "poll_query",
            label: "Gmail search query",
            kind: "text",
            required: true,
            placeholder: "is:unread newer_than:1d",
          },
          {
            path: "max_per_run",
            label: "Max messages per run",
            kind: "text",
            placeholder: "20",
          },
          {
            path: "program_name",
            label: "Program name",
            kind: "text",
            required: true,
            placeholder: "Tier 1 Performance",
            help: "Shown to applicants in the welcome email.",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "agent",
        label: "Program intake criteria",
        hint: "Eligibility (age, rating, prerequisites), evaluation flow, what acceptance means, what the program costs.",
      },
    ],
    allowedTools: [
      "gmail.read_inbox",
      "gmail.read_thread",
      "gmail.draft_reply",
      "knowledge.search",
      "llm.classify",
      "llm.generate",
      "llm.extract_signals",
    ],
    mutatingTools: ["gmail.draft_reply"],
  },

  tournament_reports: {
    type: "tournament_reports",
    label: "Tournament Reports",
    category: "analytics",
    triggerKind: "on_demand",
    connections: [
      {
        title: "Tournament data sources",
        description:
          "Public sites the agent scans when generating a report. Add the URL patterns the agent should search.",
        fields: [
          {
            path: "source_config.usta_tennislink.urls",
            label: "USTA TennisLink URLs",
            kind: "url_list",
          },
          {
            path: "source_config.utr.urls",
            label: "UTR URLs",
            kind: "url_list",
          },
          {
            path: "source_config.tennis_recruiting.urls",
            label: "TennisRecruiting URLs",
            kind: "url_list",
          },
          {
            path: "source_config.ajga.urls",
            label: "AJGA URLs (golf)",
            kind: "url_list",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "agent",
        label: "Report style guide",
        hint: "Tone, length, what coaches/parents expect to see — examples of good past reports.",
      },
    ],
    allowedTools: [
      "web.fetch_public_url",
      "web.parse_html",
      "knowledge.search",
      "llm.generate",
      "students.lookup",
    ],
    mutatingTools: [],
  },

  golf_lead_finder: {
    type: "golf_lead_finder",
    label: "Golf Lead Finder",
    category: "lead_generation",
    triggerKind: "cron",
    connections: [
      {
        title: "Gmail",
        description: "Where approved outreach emails are sent from.",
        fields: [
          {
            path: "gmail.account",
            label: "Send-from address",
            kind: "oauth_gmail",
            required: true,
          },
        ],
      },
      {
        title: "Public golf data sources",
        description:
          "Add the page URLs the agent should scan each week. The golf coach edits these — same data sources, different watchlists per business.",
        fields: [
          {
            path: "source_config.ajga.urls",
            label: "AJGA pages",
            kind: "url_list",
            placeholder: "https://www.ajga.org/players/leaderboard",
          },
          {
            path: "source_config.junior_golf_scoreboard.urls",
            label: "Junior Golf Scoreboard pages",
            kind: "url_list",
            placeholder: "https://www.jgscoreboard.com/rankings/state/WA",
          },
          {
            path: "source_config.junior_golf_hub.urls",
            label: "Junior Golf Hub pages",
            kind: "url_list",
          },
          {
            path: "source_config.wiaa_wa_golf.urls",
            label: "WIAA / state golf pages",
            kind: "url_list",
          },
        ],
      },
      {
        title: "Contact resolution",
        description:
          "Optional — used to find a parent's email when the page only lists the kid.",
        fields: [
          {
            path: "hunter_io.api_key",
            label: "Hunter.io API key",
            kind: "secret",
            help: "Optional. If supplied, the agent attempts email lookups; without it, prospects without contact info are skipped.",
          },
        ],
      },
      {
        title: "Throttle",
        fields: [
          {
            path: "icp_threshold",
            label: "Min ICP score (0–10)",
            kind: "text",
            placeholder: "6",
          },
          {
            path: "max_per_run",
            label: "Max prospects per run",
            kind: "text",
            placeholder: "10",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "agent",
        label: "Good-fit criteria",
        hint: "Who you want as a student — age, skill level, geography, signals you score positively.",
      },
      {
        scope: "agent",
        label: "Outreach voice & examples",
        hint: "Past examples of outreach that worked. The agent matches this voice when drafting.",
      },
    ],
    allowedTools: [
      "web.fetch_public_url",
      "web.parse_html",
      "knowledge.search",
      "hunter_io.find_email",
      "llm.score_prospect",
      "llm.generate",
      "gmail.draft_reply",
      "prospects.upsert",
    ],
    mutatingTools: ["gmail.draft_reply", "prospects.upsert"],
  },

  // 5th WSC agent — Tier 1 Scheduling. Built out in the Console for the demo;
  // expected to be preflight-blocked until WSC provides CourtReserve API access
  // and the coach behavior shift happens. The block IS the demo for this one.
  tier1_scheduling: {
    type: "tier1_scheduling",
    label: "Tier 1 Scheduling & Family Q&A",
    category: "customer_ops",
    triggerKind: "inbound",
    connections: [
      {
        title: "Gmail",
        description:
          "Tier 1 family inbox. Same inbox as Tier 1 Performance onboarding by design — both agents can co-exist on it.",
        fields: [
          {
            path: "gmail.account",
            label: "Tier 1 inbox",
            kind: "oauth_gmail",
            required: true,
          },
        ],
      },
      {
        title: "CourtReserve",
        description:
          "Reads coach availability windows + writes booked private lessons. We recommend a write-scoped API key — never one with delete or refund permissions.",
        fields: [
          {
            path: "courtreserve.api_url",
            label: "API base URL",
            kind: "url_list",
            required: true,
          },
          {
            path: "courtreserve.api_key",
            label: "API key (write scope only)",
            kind: "secret",
            required: true,
            help: "Use a key scoped to read availability + create bookings. Do not issue a key with delete/cancel scope — Fern's tool list cannot call those endpoints anyway, but defense in depth.",
          },
        ],
      },
      {
        title: "Coach availability sources",
        description:
          "Each coach's availability window — set once in CourtReserve, updated weekly. Replaces the email-negotiated booking flow.",
        fields: [
          {
            path: "source_config.coach_calendars.urls",
            label: "Coach calendar references",
            kind: "url_list",
            required: true,
            help: "One URL per coach. Tells the agent where to read each coach's posted availability.",
          },
        ],
      },
      {
        title: "Polling",
        fields: [
          {
            path: "poll_query",
            label: "Gmail search query",
            kind: "text",
            required: true,
            placeholder: "is:unread newer_than:1d",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "agent",
        label: "Tier 1 family policies",
        hint: "How private-lesson booking works, cancellation rules, family billing structure, who handles edge cases.",
      },
    ],
    allowedTools: [
      "gmail.read_inbox",
      "gmail.read_thread",
      "gmail.draft_reply",
      "knowledge.search",
      "llm.classify",
      "llm.generate",
      "courtreserve.read_availability",
      "courtreserve.create_booking",
    ],
    mutatingTools: ["gmail.draft_reply", "courtreserve.create_booking"],
  },

  // ─── Other already-built agents ────────────────────────────────────────────

  signal_hunter: {
    type: "signal_hunter",
    label: "Signal Hunter (Tennis)",
    category: "lead_generation",
    triggerKind: "cron",
    connections: [
      {
        title: "Gmail",
        fields: [
          {
            path: "gmail.account",
            label: "Send-from address",
            kind: "oauth_gmail",
            required: true,
          },
        ],
      },
      {
        title: "Source URLs",
        description: "Per-source URL lists the agent scans on each run.",
        fields: [
          {
            path: "source_config.usta_tennislink_wa_juniors.urls",
            label: "USTA TennisLink",
            kind: "url_list",
          },
          {
            path: "source_config.utr_state_search.urls",
            label: "UTR state search",
            kind: "url_list",
          },
        ],
      },
      {
        title: "Contact resolution",
        fields: [
          {
            path: "hunter_io.api_key",
            label: "Hunter.io API key",
            kind: "secret",
          },
        ],
      },
      {
        title: "Throttle",
        fields: [
          {
            path: "icp_threshold",
            label: "Min ICP score (0–10)",
            kind: "text",
            placeholder: "7",
          },
          {
            path: "max_per_run",
            label: "Max prospects per run",
            kind: "text",
            placeholder: "30",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "agent",
        label: "ICP & outreach style",
        hint: "Who you want and how you talk to them — the agent grounds scoring and drafting in this.",
      },
    ],
    allowedTools: [
      "web.fetch_public_url",
      "web.parse_html",
      "knowledge.search",
      "hunter_io.find_email",
      "llm.score_prospect",
      "llm.generate",
      "gmail.draft_reply",
      "prospects.upsert",
    ],
    mutatingTools: ["gmail.draft_reply", "prospects.upsert"],
  },

  competitor_watch: {
    type: "competitor_watch",
    label: "Competitor Watch",
    category: "analytics",
    triggerKind: "cron",
    connections: [
      {
        title: "Watchlist",
        description:
          "Competitor sites the agent scans every week. Add the homepage; add specific pages (pricing, events) if you want them tracked too.",
        fields: [
          {
            path: "watchlist",
            label: "Competitor homepages",
            kind: "url_list",
            required: true,
            help: "One URL per line. Each becomes a tracked competitor.",
          },
        ],
      },
      {
        title: "Delivery",
        fields: [
          {
            path: "gmail.account",
            label: "Email digest to",
            kind: "text",
            required: true,
            placeholder: "owner@yourbusiness.com",
            help: "Where the weekly recap is delivered.",
          },
          {
            path: "delivery_day",
            label: "Delivery day",
            kind: "text",
            placeholder: "Monday",
          },
        ],
      },
    ],
    allowedTools: [
      "web.fetch_public_url",
      "web.parse_html",
      "llm.summarize",
      "gmail.send_digest",
    ],
    mutatingTools: ["gmail.send_digest"],
  },

  corporate_event_hunter: {
    type: "corporate_event_hunter",
    label: "Corporate Event Hunter",
    category: "lead_generation",
    triggerKind: "cron",
    connections: [
      {
        title: "Gmail",
        fields: [
          {
            path: "gmail.account",
            label: "Send-from address",
            kind: "oauth_gmail",
            required: true,
          },
        ],
      },
      {
        title: "Signal sources",
        description: "Public news sources the agent monitors.",
        fields: [
          {
            path: "signal_sources_urls",
            label: "News page URLs",
            kind: "url_list",
            required: true,
            help: "GeekWire, Puget Sound Business Journal, etc.",
          },
        ],
      },
      {
        title: "Throttle",
        fields: [
          {
            path: "min_confidence",
            label: "Min confidence (1–10)",
            kind: "text",
            placeholder: "7",
          },
          {
            path: "max_drafts_per_run",
            label: "Max drafts per run",
            kind: "text",
            placeholder: "5",
          },
          {
            path: "lookback_days",
            label: "Lookback days",
            kind: "text",
            placeholder: "7",
          },
        ],
      },
    ],
    requiredKnowledge: [
      {
        scope: "agent",
        label: "Event venue capabilities & ICP",
        hint: "What kinds of events you can host, capacity, distinctive features, who's a good corporate fit.",
      },
    ],
    allowedTools: [
      "web.fetch_public_url",
      "web.parse_html",
      "knowledge.search",
      "llm.score_signal",
      "llm.generate",
      "gmail.draft_reply",
    ],
    mutatingTools: ["gmail.draft_reply"],
  },
};

/** Get a manifest by type slug, or null if unknown. */
export function getManifest(type: string | null | undefined): AgentManifest | null {
  if (!type) return null;
  return MANIFESTS[type] ?? null;
}
