/**
 * Seeds the global agent_types catalog (the marketplace) and a small set
 * of demo students for the tournament_reports UI testing.
 *
 * Run after migration 0005 has been applied:
 *   npm run seed:marketplace
 *
 * Idempotent: upserts agent_types by `key` and demo students by name.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_ORG_SLUG = "demo-sports-club";

// ─── Agent Types — the installable catalog ────────────────────────────────────
//
// Each entry's `key` matches the Hetzner agent folder name and the
// agents.config.type field — that's how the runtime resolves which
// org's agent_id corresponds to a code path.

type AgentTypeSeed = {
  key: string;
  name: string;
  description: string;
  category: "customer_ops" | "lead_generation" | "analytics" | "workflow";
  trigger_kind: "cron" | "inbound" | "on_demand";
  default_config: Record<string, unknown>;
  icon: string;
  position: number;
  is_published: boolean;
};

const AGENT_TYPES: AgentTypeSeed[] = [
  {
    key: "customer_qa",
    name: "Customer Q&A",
    description:
      "Watches the general support inbox, classifies each message, and drafts a grounded reply from the business's knowledge bucket. Anything off-topic, low-confidence, or beyond the knowledge escalates to a human.",
    category: "customer_ops",
    trigger_kind: "inbound",
    default_config: {
      enabled: false,
      approval_required: true,
      poll_query: "is:unread newer_than:1d",
      max_per_run: 20,
    },
    icon: "MessageCircle",
    position: 0,
    is_published: true,
  },
  {
    key: "enrollment_funnel",
    name: "Enrollment Funnel",
    description:
      "Multi-stage admission / intake agent. Extracts structured signals (age, ratings, prerequisites) from new inquiries, applies routing rules to pick an evaluation class, and drafts the welcome reply. Handles the ongoing thread through paperwork.",
    category: "customer_ops",
    trigger_kind: "inbound",
    default_config: {
      enabled: false,
      approval_required: true,
      program_name: "",
      poll_query: "is:unread newer_than:1d",
      max_per_run: 20,
      signals: {},
      routing_rules: [],
    },
    icon: "GitBranch",
    position: 1,
    is_published: true,
  },
  {
    key: "tournament_reports",
    name: "Tournament Reports",
    description:
      "On-demand player report generator. Coach searches a kid in the Console, clicks Generate Report, and the agent pulls match + rating data from configured public sources (USTA, UTR, TennisRecruiting, etc.) and synthesizes a narrative report grounded in the data.",
    category: "analytics",
    trigger_kind: "on_demand",
    default_config: {
      enabled: true,
      sources: [],
      source_config: {},
    },
    icon: "BarChart3",
    position: 2,
    is_published: true,
  },
  {
    key: "golf_lead_finder",
    name: "Golf Lead Finder",
    description:
      "Weekly junior-golf prospecting. Scans configured public sources (AJGA, Junior Golf Scoreboard, Junior Golf Hub, WIAA) for kids matching the business's good-fit criteria, drafts personalized outreach grounded in the kid's actual recent results. Always human-approved before send.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: {
      enabled: false,
      approval_required: true,
      icp_threshold: 6,
      max_per_run: 10,
      sources: ["ajga", "junior_golf_scoreboard", "junior_golf_hub", "wiaa_wa_golf"],
      source_config: {},
    },
    icon: "Target",
    position: 3,
    is_published: true,
  },
  {
    key: "signal_hunter",
    name: "Signal Hunter (Tennis)",
    description:
      "Junior tennis prospecting. Scans USTA TennisLink, UTR public profiles, and TennisRecruiting for in-market players with rising trajectories. Drafts personalized outreach to parents grounded in the kid's specific results.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: {
      enabled: false,
      approval_required: true,
      icp_threshold: 7,
      max_per_run: 30,
      sources: [],
    },
    icon: "Crosshair",
    position: 4,
    is_published: true,
  },
  {
    key: "competitor_watch",
    name: "Competitor Watch",
    description:
      "Weekly digest of competitor public-facing changes. Fetches each competitor's pages, flags pricing / event / staffing changes, sends a Monday-morning recap.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: {
      enabled: false,
      run_cadence: "weekly",
      delivery_day: "Monday",
      watchlist: [],
    },
    icon: "Eye",
    position: 5,
    is_published: true,
  },
  {
    key: "corporate_event_hunter",
    name: "Corporate Event Hunter",
    description:
      "Weekly scan of local business news for companies likely to book private events (funding, expansions, anniversaries). Drafts cold outreach for human approval.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: {
      enabled: false,
      approval_required: true,
      run_cadence: "weekly",
      lookback_days: 7,
      signal_sources: [],
    },
    icon: "Building2",
    position: 6,
    is_published: true,
  },
];

// ─── Demo students (only seeded into demo-sports-club org) ───────────────────

const DEMO_STUDENTS = [
  {
    full_name: "Maya Klein",
    preferred_name: "Maya",
    age: 12,
    location: "Bellevue, WA",
    sport: "tennis",
    current_rating: 5.8,
    current_rating_label: "UTR",
    parent_name: "Daniel Klein",
    parent_email: "daniel.klein@example.com",
    status: "active",
    metadata: {
      current_program: "Tier 1 Performance",
      eval_status: "enrolled",
    },
  },
  {
    full_name: "Aiden Park",
    preferred_name: "Aiden",
    age: 14,
    location: "Redmond, WA",
    sport: "tennis",
    current_rating: 7.1,
    current_rating_label: "UTR",
    parent_name: "Hyun Park",
    parent_email: "hyun.park@example.com",
    status: "active",
    metadata: { current_program: "Tier 1 Performance" },
  },
  {
    full_name: "Ella Sanders",
    preferred_name: "Ella",
    age: 10,
    location: "Kirkland, WA",
    sport: "tennis",
    current_rating: 4.2,
    current_rating_label: "UTR",
    parent_name: "Maria Sanders",
    parent_email: "maria.sanders@example.com",
    status: "evaluating",
    metadata: { current_program: "Tier 1 Core Yellow Ball" },
  },
  {
    full_name: "Owen Wright",
    preferred_name: "Owen",
    age: 13,
    location: "Sammamish, WA",
    sport: "golf",
    current_rating: 78,
    current_rating_label: "AJGA Performance Stars",
    parent_name: "James Wright",
    parent_email: "j.wright@example.com",
    status: "prospect",
    metadata: { discovered_via: "AJGA tournament results" },
  },
  {
    full_name: "Liam Brennan",
    preferred_name: "Liam",
    age: 11,
    location: "Issaquah, WA",
    sport: "tennis",
    current_rating: 4.8,
    current_rating_label: "UTR",
    parent_name: "Megan Brennan",
    parent_email: "m.brennan@example.com",
    status: "prospect",
    metadata: { discovered_via: "USTA TennisLink" },
  },
];

async function main() {
  console.log("Seeding marketplace + students…");

  // 1. Upsert agent types
  console.log(`  agent_types: upserting ${AGENT_TYPES.length} entries…`);
  const { error: typesError } = await supabase
    .from("agent_types")
    .upsert(AGENT_TYPES, { onConflict: "key" });
  if (typesError) {
    console.error("  agent_types upsert failed:", typesError);
    process.exit(1);
  }
  console.log(`  agent_types: ✓`);

  // 2. Find demo org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, slug")
    .eq("slug", DEMO_ORG_SLUG)
    .maybeSingle();
  if (orgErr) {
    console.error("  org lookup failed:", orgErr);
    process.exit(1);
  }
  if (!org) {
    console.warn(
      `  ${DEMO_ORG_SLUG} not found — run \`npm run seed\` first to create it.`
    );
    return;
  }

  // 3. Upsert demo students into the demo org
  //    Idempotent via name match within org.
  console.log(`  students: ensuring ${DEMO_STUDENTS.length} demo entries in ${DEMO_ORG_SLUG}…`);
  for (const s of DEMO_STUDENTS) {
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("org_id", org.id)
      .eq("full_name", s.full_name)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("students")
        .update(s)
        .eq("id", existing.id);
      if (error) console.error(`    update ${s.full_name} failed:`, error);
    } else {
      const { error } = await supabase
        .from("students")
        .insert([{ ...s, org_id: org.id }]);
      if (error) console.error(`    insert ${s.full_name} failed:`, error);
    }
  }
  console.log(`  students: ✓`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
