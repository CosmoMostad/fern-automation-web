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

  // ─── customer_ops — additional ────────────────────────────────────────────
  {
    key: "appointment_reminder",
    name: "Appointment Reminder",
    description:
      "Sends timed reminder emails for upcoming bookings — lessons, evaluations, court reservations. Pulls from your scheduling system, drafts the message, sends on the cadence you set (24h, 2h, etc.).",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: false },
    icon: "Bell",
    position: 10,
    is_published: true,
  },
  {
    key: "no_show_recovery",
    name: "No-Show Recovery",
    description:
      "When a member misses a session, drafts a warm follow-up to get them rebooked. Different tone for a first miss vs. a pattern. Keeps members engaged who would otherwise quietly drift away.",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "RotateCcw",
    position: 11,
    is_published: true,
  },
  {
    key: "waitlist_filler",
    name: "Waitlist Filler",
    description:
      "When a class spot opens, automatically offers it to the next person on the waitlist with a time-bounded link. Keeps your classes full without staff babysitting cancellations.",
    category: "customer_ops",
    trigger_kind: "inbound",
    default_config: { enabled: false, approval_required: false },
    icon: "ListOrdered",
    position: 12,
    is_published: true,
  },
  {
    key: "review_responder",
    name: "Review Responder",
    description:
      "Watches Google, Yelp, and Facebook reviews. Drafts a thoughtful, on-brand reply for every new review — positive or negative — for a human to approve and post. Catches the unhappy ones before they fester.",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Star",
    position: 13,
    is_published: true,
  },
  {
    key: "membership_renewal",
    name: "Membership Renewal",
    description:
      "Identifies memberships expiring in the next 30 / 14 / 7 days and drafts a renewal nudge tuned to each member's history. Handles inbound renewal questions in the same thread.",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Calendar",
    position: 14,
    is_published: true,
  },
  {
    key: "welcome_sequence",
    name: "New Member Onboarding",
    description:
      "Multi-touch welcome sequence for new sign-ups — schedules first session, sends facility info, follows up after week one. Replaces the manual 'did anyone email the new guy yet' problem.",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Sparkles",
    position: 15,
    is_published: true,
  },
  {
    key: "billing_qa",
    name: "Billing Q&A",
    description:
      "Handles routine billing-question emails — charge clarifications, plan changes, refund requests within policy. Anything ambiguous or over-policy escalates to a human with full context attached.",
    category: "customer_ops",
    trigger_kind: "inbound",
    default_config: { enabled: false, approval_required: true },
    icon: "Receipt",
    position: 16,
    is_published: true,
  },
  {
    key: "feedback_collector",
    name: "Feedback Collector",
    description:
      "Sends post-session feedback / NPS emails on a schedule, aggregates responses, surfaces themes. The data flows back into the Console so you can see trends without reading every reply.",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: false },
    icon: "MessageSquare",
    position: 17,
    is_published: true,
  },
  {
    key: "winback",
    name: "Lapsed Member Win-Back",
    description:
      "Identifies members who've stopped showing up or canceled, drafts a personal-feeling re-engagement message tied to what they used to do at the club. Time-tested, low-effort revenue.",
    category: "customer_ops",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Heart",
    position: 18,
    is_published: true,
  },
  {
    key: "complaint_triage",
    name: "Complaint Triage",
    description:
      "Reads inbound complaint emails, classifies severity and topic, routes to the right staff member, and drafts an immediate acknowledgement so the member never feels ignored.",
    category: "customer_ops",
    trigger_kind: "inbound",
    default_config: { enabled: false, approval_required: true },
    icon: "AlertCircle",
    position: 19,
    is_published: true,
  },
  {
    key: "contact_form_intake",
    name: "Contact Form Intake",
    description:
      "Receives website contact-form submissions, classifies intent (sales, support, scheduling), drafts the right reply, and routes a copy to the right inbox so nothing sits in a generic info@ pile.",
    category: "customer_ops",
    trigger_kind: "inbound",
    default_config: { enabled: false, approval_required: true },
    icon: "Inbox",
    position: 20,
    is_published: true,
  },

  // ─── lead_generation — additional ─────────────────────────────────────────
  {
    key: "new_mover_outreach",
    name: "New-Mover Outreach",
    description:
      "Identifies families who recently moved into your service area and drafts a warm intro offering a tour and trial session. New movers are statistically the easiest local conversion.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Home",
    position: 30,
    is_published: true,
  },
  {
    key: "birthday_party_lead",
    name: "Birthday Party Lead",
    description:
      "Finds local families with kids approaching birthday season and drafts a party-package pitch tuned to the kid's age. Surfaces a category of revenue most clubs leave on the table.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Cake",
    position: 31,
    is_published: true,
  },
  {
    key: "school_partnership",
    name: "School & PTA Partnership",
    description:
      "Researches nearby schools and PTAs, identifies the right contact at each, drafts a partnership pitch (after-school programs, fundraiser nights, P.E. partnerships).",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "GraduationCap",
    position: 32,
    is_published: true,
  },
  {
    key: "summer_camp_outreach",
    name: "Summer Camp Outreach",
    description:
      "Seasonal outbound to families with school-age kids in your area as summer approaches — full-day camps, half-day options, sibling discounts. Tuned to your camp lineup.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Sun",
    position: 33,
    is_published: true,
  },
  {
    key: "corporate_wellness",
    name: "Corporate Wellness Outreach",
    description:
      "Finds local companies likely to fund employee wellness benefits (mid-size, recently funded, expanding) and drafts a corporate-membership pitch to the right HR contact.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Briefcase",
    position: 34,
    is_published: true,
  },
  {
    key: "referral_activator",
    name: "Referral Activator",
    description:
      "Identifies happy, long-tenured members likely to refer and drafts a personal ask tied to a small reward. Far higher conversion than a static referral page.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "UserPlus",
    position: 35,
    is_published: true,
  },
  {
    key: "sponsor_finder",
    name: "Event Sponsor Finder",
    description:
      "For tournaments, fundraisers, or member events — finds local businesses whose audience overlaps yours and drafts a tiered sponsorship pitch.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Award",
    position: 36,
    is_published: true,
  },
  {
    key: "alumni_winback",
    name: "Alumni Win-Back",
    description:
      "Reaches former members who left amicably with a returning-member offer tied to what's new since they left. Cheaper to bring back a known face than acquire a stranger.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Users",
    position: 37,
    is_published: true,
  },
  {
    key: "press_pitch",
    name: "Press & Media Pitch",
    description:
      "When something newsworthy happens at the club — a kid wins state, you open a new facility, you host a celeb — drafts a pitch to local press contacts who actually cover that beat.",
    category: "lead_generation",
    trigger_kind: "on_demand",
    default_config: { enabled: false, approval_required: true },
    icon: "Megaphone",
    position: 38,
    is_published: true,
  },
  {
    key: "partnership_finder",
    name: "Cross-Business Partnership Finder",
    description:
      "Finds non-competing local businesses with overlapping audiences (PT clinics, kids' sportswear, healthy-meal services) and drafts cross-promotion pitches.",
    category: "lead_generation",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Handshake",
    position: 39,
    is_published: true,
  },

  // ─── analytics — additional ───────────────────────────────────────────────
  {
    key: "weekly_briefing",
    name: "Weekly Owner Briefing",
    description:
      "Monday-morning summary of everything that happened across all your agents last week — drafts sent, leads qualified, complaints resolved, anomalies flagged. One email, full picture.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false, run_cadence: "weekly" },
    icon: "FileText",
    position: 50,
    is_published: true,
  },
  {
    key: "attendance_trends",
    name: "Attendance Trend Watcher",
    description:
      "Watches class and program attendance week-over-week, flags drops before they become churn. Tells you which member just stopped showing up — quietly — and why it might matter.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "TrendingDown",
    position: 51,
    is_published: true,
  },
  {
    key: "revenue_anomaly",
    name: "Revenue Anomaly Watch",
    description:
      "Daily revenue summary with anomalies flagged in plain English — 'Tuesday court bookings down 40% vs. last 4 Tuesdays.' Signals to investigate, not numbers to interpret.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "AlertTriangle",
    position: 52,
    is_published: true,
  },
  {
    key: "staffing_forecast",
    name: "Staffing Demand Forecast",
    description:
      "Looks at upcoming class loads, historical patterns, and current bookings; flags weeks where you'll need a sub or where a coach is overbooked. Forward-looking, not reactive.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "Calendar",
    position: 53,
    is_published: true,
  },
  {
    key: "member_health_score",
    name: "Member Health Score",
    description:
      "Per-member engagement score combining attendance, billing, last contact, program participation. Surfaces the at-risk members before they cancel.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "Activity",
    position: 54,
    is_published: true,
  },
  {
    key: "coach_utilization",
    name: "Coach Utilization Report",
    description:
      "Weekly report on how each coach's hours are loading — under-booked coaches, over-booked coaches, gaps where a private slot could be sold. Helps fix coach economics in real time.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false, run_cadence: "weekly" },
    icon: "UserCheck",
    position: 55,
    is_published: true,
  },
  {
    key: "program_roi",
    name: "Program ROI Report",
    description:
      "Periodic ROI breakdown by program / class type — revenue, attendance, churn. Tells you which programs to expand and which to quietly retire.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "PieChart",
    position: 56,
    is_published: true,
  },
  {
    key: "social_listening",
    name: "Social Listening",
    description:
      "Monitors local parent groups, neighborhood forums, and social platforms for mentions of your club or your category. Surfaces conversations to join — and the occasional complaint to defuse.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "Radio",
    position: 57,
    is_published: true,
  },
  {
    key: "search_visibility",
    name: "Local Search Visibility",
    description:
      "Weekly check on where you rank for the local terms that matter ('tennis lessons Bellevue', 'kids golf academy Redmond'). Flags drops, surfaces competitor moves.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false, run_cadence: "weekly" },
    icon: "Search",
    position: 58,
    is_published: true,
  },
  {
    key: "review_sentiment",
    name: "Review Sentiment Trend",
    description:
      "Monthly trend of public review sentiment across Google, Yelp, Facebook — what's going up, what's going down, what topics are driving each. Strategic, not just operational.",
    category: "analytics",
    trigger_kind: "cron",
    default_config: { enabled: false, run_cadence: "monthly" },
    icon: "TrendingUp",
    position: 59,
    is_published: true,
  },

  // ─── workflow — internal automations ──────────────────────────────────────
  {
    key: "staff_scheduler",
    name: "Staff Scheduler",
    description:
      "Drafts the upcoming week's coach schedule from each coach's submitted availability and your class lineup. You review and post — instead of building it from scratch every Sunday night.",
    category: "workflow",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "CalendarDays",
    position: 70,
    is_published: true,
  },
  {
    key: "private_lesson_booker",
    name: "Private Lesson Booker",
    description:
      "Handles inbound private-lesson requests end-to-end — checks coach availability, proposes a slot, books once confirmed. The coach behavior shift (set availability windows in Console) is what makes this work cleanly.",
    category: "workflow",
    trigger_kind: "inbound",
    default_config: { enabled: false, approval_required: true },
    icon: "Clock",
    position: 71,
    is_published: true,
  },
  {
    key: "waitlist_manager",
    name: "Waitlist Manager",
    description:
      "Manages the full waitlist lifecycle — priority order, communications, conversion tracking. Different from Waitlist Filler in that it's strategic (who gets the slot) rather than tactical (offer the slot).",
    category: "workflow",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "ListChecks",
    position: 72,
    is_published: true,
  },
  {
    key: "doc_generator",
    name: "Document Generator",
    description:
      "On-demand contracts, waivers, custom forms, and registration paperwork generated from templates plus the right member data. Pre-filled, ready to send for signature.",
    category: "workflow",
    trigger_kind: "on_demand",
    default_config: { enabled: false },
    icon: "FileSignature",
    position: 73,
    is_published: true,
  },
  {
    key: "meeting_prep",
    name: "Meeting Prep Briefer",
    description:
      "Before each external meeting — coach-parent, prospect tour, partnership call — assembles a one-page brief from CRM history, prior emails, and notes. You walk in knowing the context.",
    category: "workflow",
    trigger_kind: "on_demand",
    default_config: { enabled: false },
    icon: "BookOpen",
    position: 74,
    is_published: true,
  },
  {
    key: "meeting_notes",
    name: "Meeting Notes Synthesizer",
    description:
      "Turns a meeting recording or transcript into structured notes — decisions, action items, owners, deadlines — and routes the right pieces to the right people / systems.",
    category: "workflow",
    trigger_kind: "on_demand",
    default_config: { enabled: false },
    icon: "ClipboardList",
    position: 75,
    is_published: true,
  },
  {
    key: "ar_collector",
    name: "Overdue Invoice Follow-Up",
    description:
      "Drafts polite, escalating follow-ups on overdue invoices on a cadence you set. Tone is professional, not pushy; payment links included. Keeps cash flow healthy without awkward staff calls.",
    category: "workflow",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "DollarSign",
    position: 76,
    is_published: true,
  },
  {
    key: "vendor_renewal_tracker",
    name: "Vendor Renewal Tracker",
    description:
      "Tracks every vendor and software contract — renewal dates, costs, auto-renew clauses — and flags upcoming renewals 60 / 30 / 7 days out so they never auto-renew on you silently.",
    category: "workflow",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "FileClock",
    position: 77,
    is_published: true,
  },
  {
    key: "inventory_reorder",
    name: "Pro-Shop Inventory Reorder",
    description:
      "Watches pro-shop inventory levels, drafts reorder requests when stock crosses thresholds, learns seasonal patterns over time. Less stock-out, less over-ordering.",
    category: "workflow",
    trigger_kind: "cron",
    default_config: { enabled: false, approval_required: true },
    icon: "Package",
    position: 78,
    is_published: true,
  },
  {
    key: "compliance_monitor",
    name: "Staff Compliance Monitor",
    description:
      "Tracks staff certifications — CPR, first aid, USPTA, USTA Safe Play, background checks — and flags expirations 60 / 30 / 7 days out with renewal links. Never get caught off-cycle.",
    category: "workflow",
    trigger_kind: "cron",
    default_config: { enabled: false },
    icon: "ShieldCheck",
    position: 79,
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
