/**
 * Seeds demo content into demo-sports-club so the agent workspace tabs
 * are visually rich on first click:
 *
 *   - student_reports for the 5 demo students with realistic ratingHistory,
 *     recentMatches, and a narrative markdown body
 *   - prospects + drafted outreach for golf_lead_finder so the Prospects tab
 *     has cards with proper signal text, ICP scores, and email drafts ready
 *     for approve/edit/pass
 *
 * Idempotent — replaces all demo content on each run so re-running this
 * after schema changes is safe.
 *
 * Run after the main seed:
 *   npm run seed:demo-content
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

// ─── Tournament-report demo content (per student) ───────────────────────────

type ReportSeed = {
  studentName: string;
  source_data: Record<string, unknown>;
  body_markdown: string;
};

const TENNIS_REPORTS: ReportSeed[] = [
  {
    studentName: "Maya Klein",
    source_data: {
      ratingHistory: [
        { date: "2025-11-08", rating: 5.2 },
        { date: "2025-12-02", rating: 5.3 },
        { date: "2025-12-21", rating: 5.4 },
        { date: "2026-01-14", rating: 5.6 },
        { date: "2026-02-09", rating: 5.7 },
        { date: "2026-03-05", rating: 5.7 },
        { date: "2026-04-02", rating: 5.8 },
        { date: "2026-04-25", rating: 5.8 },
      ],
      recentMatches: [
        { date: "2026-04-25", opponent: "Sienna Park", opponentRating: 6.1, score: "6-4, 7-5", win: true },
        { date: "2026-04-12", opponent: "Olivia Reyes", opponentRating: 5.9, score: "6-3, 6-4", win: true },
        { date: "2026-03-28", opponent: "Hannah Wu", opponentRating: 6.4, score: "4-6, 7-6, 6-4", win: true },
        { date: "2026-03-14", opponent: "Lily Tanaka", opponentRating: 5.5, score: "6-2, 6-3", win: true },
        { date: "2026-02-22", opponent: "Mia Brennan", opponentRating: 6.2, score: "3-6, 6-4, 4-6", win: false },
        { date: "2026-02-08", opponent: "Sophie Adler", opponentRating: 5.4, score: "6-4, 6-2", win: true },
        { date: "2026-01-25", opponent: "Cara Nguyen", opponentRating: 6.0, score: "5-7, 4-6", win: false },
      ],
    },
    body_markdown: `# Maya Klein — Tournament Report

*Generated 2026-05-02 from USTA TennisLink, UTR public profile, and Tennis Recruiting Network.*

## Snapshot
12-year-old Bellevue tennis player, currently UTR 5.8 with a steady upward trajectory over the past 6 months (5.2 → 5.8). Most recent result: top-4 finish at the **Tacoma Junior Open** on April 25 with a clean straight-set win over a 6.1.

## Recent results
- **2026-04-25** — Tacoma Junior Open SF: def. Sienna Park (6.1) 6-4, 7-5. Held serve under pressure at 5-5 in the second set.
- **2026-04-12** — Eastside Cup R32: def. Olivia Reyes (5.9) 6-3, 6-4. Cleanest match of the season — 4 unforced errors total.
- **2026-03-28** — Spring Sectionals QF: def. Hannah Wu (6.4) 4-6, 7-6, 6-4. First win above her rating in 8 months.
- **2026-03-14** — Local L4 W: def. Lily Tanaka (5.5) 6-2, 6-3.
- **2026-02-22** — PNW Junior R32: lost to Mia Brennan (6.2) 3-6, 6-4, 4-6. Three-setter against a strong opponent — not a bad loss.

## Trajectory
Rating climbed **+0.6 over 6 months**, with the biggest jump in late March after the Hannah Wu upset. Pace has been steady, not spiky — a healthy sign that gains are real, not single-tournament noise.

## Opponent quality
Average opponent rating in last 7 matches: **5.93**, against her own 5.7–5.8. She is consistently competing **above** her level, which is the right pattern for a player on the way up. Win rate in those matches: 5/7 (71%).

## Surface and pace patterns
Hard court only — insufficient surface variation in recent data to comment on clay or grass adaptation.

## Observations and next steps for the coach
- **Tactical:** her three-set win over Wu (6.4) shows real grit at the end of long matches. Worth building more match-play volume in that 5.9–6.4 range to compound the pattern.
- **Pattern of play:** straight-set wins are common, three-setters are when she beats higher rated opponents. Consider focused work on closing-out games when leading 4-2 or 5-3 — currently letting opponents back in.
- **Schedule:** she's earned a step up. The PNW Junior R32 loss to Brennan was a quality battle, not a setback. Look for tournaments with a draw averaging 6.0–6.5.
- **Watch for:** plateau at 5.8. The next 0.2 will be harder. Mental side becomes a bigger factor at this level.`,
  },
  {
    studentName: "Aiden Park",
    source_data: {
      ratingHistory: [
        { date: "2025-11-15", rating: 6.4 },
        { date: "2025-12-15", rating: 6.5 },
        { date: "2026-01-12", rating: 6.7 },
        { date: "2026-02-09", rating: 6.8 },
        { date: "2026-03-08", rating: 7.0 },
        { date: "2026-04-04", rating: 7.0 },
        { date: "2026-04-23", rating: 7.1 },
      ],
      recentMatches: [
        { date: "2026-04-23", opponent: "Marcus Liu", opponentRating: 7.4, score: "6-4, 4-6, 7-6", win: true },
        { date: "2026-04-09", opponent: "Tyler Nakamura", opponentRating: 7.0, score: "6-3, 6-2", win: true },
        { date: "2026-03-29", opponent: "Wesley Foster", opponentRating: 7.2, score: "5-7, 6-4, 6-3", win: true },
        { date: "2026-03-15", opponent: "Jaime Ortega", opponentRating: 6.6, score: "6-2, 6-1", win: true },
        { date: "2026-02-28", opponent: "Cole Mendes", opponentRating: 7.3, score: "4-6, 3-6", win: false },
        { date: "2026-02-15", opponent: "Sam Reyes", opponentRating: 6.8, score: "6-4, 6-3", win: true },
        { date: "2026-01-30", opponent: "Logan Pierce", opponentRating: 7.1, score: "7-6, 6-2", win: true },
      ],
    },
    body_markdown: `# Aiden Park — Tournament Report

*Generated 2026-05-02 from USTA TennisLink and UTR public profile.*

## Snapshot
14-year-old Redmond junior, **UTR 7.1**, currently ranked top-25 in WA in his age band. Recent quarterfinal appearance at the **PNW Junior Open** with a three-set win over a 7.4. Trajectory steady-up over the past 6 months.

## Recent results
- **2026-04-23** — PNW Junior Open QF: def. Marcus Liu (7.4) 6-4, 4-6, 7-6. Won the third-set tiebreak 7-3.
- **2026-04-09** — Eastside Open SF: def. Tyler Nakamura (7.0) 6-3, 6-2. Dominant.
- **2026-03-29** — Spring Sectionals R16: def. Wesley Foster (7.2) 5-7, 6-4, 6-3. Came back from a set down.
- **2026-02-28** — National Showcase R32: lost to Cole Mendes (7.3) 4-6, 3-6. Clean loss, no excuses.

## Trajectory
+0.7 in 6 months, including a meaningful step from 6.8 → 7.0 in late February after the Cole Mendes match. Reaching 7.1 puts him in the band where college recruitment becomes a real conversation in the next 12 months.

## Opponent quality
Average opponent rating in last 7 matches: **7.06** vs his own 7.0–7.1. He is matching his level, with three notable wins above (7.2, 7.3, 7.4). Win rate at level or above: 6/7.

## Surface and pace patterns
Hard court only in this dataset.

## Observations and next steps for the coach
- **He's earned the next conversation.** At 7.1 with three wins over 7.2+ in the last 60 days, this is a player whose ceiling is starting to show.
- **The Liu win was the standout.** Tiebreak in the third against a kid rated 0.3 higher = clutch. Build on the third-set fitness; that's been a separator twice in three months.
- **Mendes loss is fine.** 4-6, 3-6 against a 7.3 isn't a red flag, it's a reference for what the next level looks like. The gap is smaller than the score suggests; rematch in 6 months will be different.
- **Schedule recommendation:** start sprinkling in 18s draws to expose him to bigger frames and faster pace.`,
  },
  {
    studentName: "Ella Sanders",
    source_data: {
      ratingHistory: [
        { date: "2025-11-20", rating: 3.8 },
        { date: "2025-12-18", rating: 3.9 },
        { date: "2026-01-22", rating: 4.0 },
        { date: "2026-02-19", rating: 4.1 },
        { date: "2026-03-22", rating: 4.1 },
        { date: "2026-04-19", rating: 4.2 },
      ],
      recentMatches: [
        { date: "2026-04-19", opponent: "Aria Chen", opponentRating: 4.4, score: "6-4, 6-3", win: true },
        { date: "2026-04-05", opponent: "Lucy Park", opponentRating: 4.0, score: "6-2, 6-2", win: true },
        { date: "2026-03-22", opponent: "Zoe Carter", opponentRating: 4.5, score: "4-6, 6-7", win: false },
        { date: "2026-03-08", opponent: "Eva Rodriguez", opponentRating: 3.8, score: "6-1, 6-1", win: true },
        { date: "2026-02-15", opponent: "Sophia Martinez", opponentRating: 4.2, score: "6-3, 4-6, 6-2", win: true },
      ],
    },
    body_markdown: `# Ella Sanders — Tournament Report

*Generated 2026-05-02 from USTA TennisLink and youth tennis records.*

## Snapshot
10-year-old Kirkland junior, **UTR 4.2**, in her first competitive season. Steady upward rating climb over 5 months (3.8 → 4.2) with a recent quality win over a 4.4 at the Eastside Spring Junior.

## Recent results
- **2026-04-19** — Eastside Spring Junior R16: def. Aria Chen (4.4) 6-4, 6-3. First win over a 4.4-rated opponent.
- **2026-04-05** — Local L5 R16: def. Lucy Park (4.0) 6-2, 6-2.
- **2026-03-22** — Sectional Qualifier R32: lost to Zoe Carter (4.5) 4-6, 6-7. Tight match, no breaks of the third would have flipped it.
- **2026-02-15** — Yellow Ball Cup F: def. Sophia Martinez (4.2) 6-3, 4-6, 6-2. First three-setter, won on grit.

## Trajectory
+0.4 in 5 months — solid for a player still in the development band. The shape of the curve matters here more than the absolute numbers: she's improving at a consistent rate, not stalling.

## Opponent quality
Average opponent rating in last 5 matches: **4.18**, vs her own 4.0–4.2. She's playing at her level with one good push above (the Aria Chen win). Win rate: 4/5.

## Surface and pace patterns
Insufficient surface data — all hard court.

## Observations and next steps for the coach
- **Beginner-strong.** This is what a healthy first-year competitive trajectory looks like. The fact that she's already played one three-setter and won it (Sophia Martinez, February) says her stamina + concentration are already there.
- **The Chen win is real.** A 4.4 at age 10 is meaningful; she's beating kids tracking toward 5.0+. Consider promoting her into a 4.5 division sooner rather than later — the easy 6-1, 6-1 wins (Eva Rodriguez) aren't growth.
- **Tier 1 Core Yellow Ball is the right level for now.** Reassess in 90 days; if she clears 4.5, conversation about Tier 1 Performance evaluation.
- **Watch for:** burnout. First-year competitive juniors often peak quickly then plateau when the pressure gets real. Keep emphasizing process > result.`,
  },
];

// ─── Golf prospect demo content ─────────────────────────────────────────────

type ProspectSeed = {
  full_name: string;
  age: number;
  age_band: string;
  location: string;
  signal_type: string;
  signal_summary: string;
  signal_detail: Record<string, unknown>;
  source_name: string;
  source_url: string;
  icp_score: number;
  icp_reasoning: string;
  contact_email: string;
  contact_name: string;
  contact_relation: string;
  contact_confidence: number;
  status: "drafted";
  draft_subject: string;
  draft_body: string;
};

const GOLF_PROSPECTS: ProspectSeed[] = [
  {
    full_name: "Owen Wright",
    age: 13,
    age_band: "13-15",
    location: "Sammamish, WA",
    signal_type: "tournament_finish",
    signal_summary:
      "Top-10 finish at AJGA Performance Stars Bellevue, age-13 division (78 first round, 76 second).",
    signal_detail: {
      tournament: "AJGA Performance Stars — Bellevue",
      round: "Final",
      scores: [78, 76],
      finish: "T-7",
      date: "2026-04-26",
    },
    source_name: "AJGA",
    source_url: "https://www.ajga.org/players/leaderboard",
    icp_score: 9,
    icp_reasoning:
      "13yo Sammamish resident — squarely in WSC's geo. Two AJGA rounds in the 70s at age 13 indicates legitimate trajectory; no academy listed in his profile suggests no current premier-coaching relationship. Strong fit for Tier 1 Performance evaluation.",
    contact_email: "j.wright@example.com",
    contact_name: "James Wright",
    contact_relation: "father",
    contact_confidence: 88,
    status: "drafted",
    draft_subject: "Owen's AJGA Performance Stars finish — quick note from WSC",
    draft_body: `Hi James,

I'm Cooper Mostad — I run the golf academy at Woodinville Sports Club. Saw Owen finished T-7 at the AJGA Performance Stars in Bellevue last weekend with rounds of 78-76. At 13, that's a real result against a strong field, and I noticed his profile doesn't list a coaching academy.

We've been quietly building out the indoor program this year — 23-bay heated Toptracer range, three TrackMan simulators in the new performance lab, and I've been working closely with Mike Chen on the swing side (you'll know him from his time at Sahalee). The setup means juniors can keep practicing through the wet months without losing reps.

If you're open to it, I'd like to invite Owen to a no-charge evaluation session — he'd hit through a 60-minute block with our team, get a TrackMan baseline, and we'd talk through whether the program is the right fit for his next 12 months. No pressure either way.

Easiest scheduling is to reply to this email with a couple of times that work, and I'll send a confirmation.

Best,
Cooper Mostad
Woodinville Sports Club Golf Academy
woodinvillesportsclub.com`,
  },
  {
    full_name: "Mason Chen",
    age: 14,
    age_band: "13-15",
    location: "Issaquah, WA",
    signal_type: "ranking",
    signal_summary:
      "WA Top 50 in Junior Golf Scoreboard age-14 rankings; jumped 22 positions in the last 60 days.",
    signal_detail: {
      ranking_source: "Junior Golf Scoreboard",
      previous_rank: 67,
      current_rank: 45,
      delta_60d: 22,
      ranking_date: "2026-04-30",
    },
    source_name: "Junior Golf Scoreboard",
    source_url: "https://www.jgscoreboard.com/rankings/state/WA",
    icp_score: 8,
    icp_reasoning:
      "Issaquah-based 14yo with a fast-rising state ranking and no premier-academy listing. Geo and trajectory both fit the Tier 1 evaluation pathway; the 22-rank jump in 60 days is the clearest signal in this batch.",
    contact_email: "linda.chen@example.com",
    contact_name: "Linda Chen",
    contact_relation: "mother",
    contact_confidence: 82,
    status: "drafted",
    draft_subject: "Mason's run up the WA junior rankings",
    draft_body: `Hi Linda,

Saw Mason climbed from #67 to #45 in the WA age-14 Junior Golf Scoreboard rankings in the last 60 days — that kind of move usually means something has clicked in his game, and I wanted to reach out.

I'm Cooper at Woodinville Sports Club. We run an academy with TrackMan simulators and a Toptracer range, and we work with juniors who are tracking toward the recruitment band over the next few years. From his profile it doesn't look like he's currently working with a premier coaching program.

I'd like to extend an invitation for a free evaluation session — he'd hit through a 60-minute block with our coaching team, we'd lay out a TrackMan baseline, and you'd get an honest read on what we think the next 18 months could look like. Nothing more than that.

If that sounds useful, reply with a couple of weekday afternoons that work.

Best,
Cooper Mostad
Woodinville Sports Club
woodinvillesportsclub.com`,
  },
  {
    full_name: "Charlotte Reyes",
    age: 12,
    age_band: "9-12",
    location: "Bellevue, WA",
    signal_type: "state_placer",
    signal_summary:
      "Top-3 at the Pacific NW Junior Girls Invitational; 3rd-grade state-recognized.",
    signal_detail: {
      tournament: "Pacific NW Junior Girls Invitational",
      finish: "3rd",
      rounds: [82, 79],
      date: "2026-04-19",
    },
    source_name: "Junior Golf Hub",
    source_url: "https://www.juniorgolfhub.com",
    icp_score: 8,
    icp_reasoning:
      "12yo girl in Bellevue — exactly the underrepresented demographic WSC's golf academy has bandwidth for. Top-3 PNW invitational finish at her age band shows real talent. Worth proactive outreach.",
    contact_email: "anna.reyes@example.com",
    contact_name: "Anna Reyes",
    contact_relation: "mother",
    contact_confidence: 76,
    status: "drafted",
    draft_subject: "Charlotte's PNW Invitational finish — invitation",
    draft_body: `Hi Anna,

Cooper Mostad here at Woodinville Sports Club. Saw Charlotte finished third at the PNW Junior Girls Invitational last weekend with rounds of 82-79 — that's a strong showing, especially at age 12.

We've been intentionally growing the girls' side of the WSC golf academy this year, which is honestly underrepresented in this region. Our facility has TrackMan simulators, a 23-bay heated Toptracer range, and a coaching team that's been actively recruiting juniors who are tracking toward serious development over the next few years.

If you'd be open to it, I'd love to invite Charlotte for a complimentary evaluation session. 60 minutes with our coaches, full TrackMan baseline, and an honest conversation about whether the program is right for her. No commitment.

Reply with a couple of times that work and I'll get her on the schedule.

Best,
Cooper Mostad
Woodinville Sports Club Golf Academy`,
  },
  {
    full_name: "Lucas Fernandez",
    age: 15,
    age_band: "13-15",
    location: "Redmond, WA",
    signal_type: "state_placer",
    signal_summary:
      "WIAA 4A Boys Golf state qualifier (Eastlake HS); shot 72 in district.",
    signal_detail: {
      meet: "WIAA 4A District",
      score: 72,
      year: 2026,
      qualified_state: true,
    },
    source_name: "WIAA — Washington HS Golf",
    source_url: "https://www.wiaa.com/Page.aspx?pid=190",
    icp_score: 7,
    icp_reasoning:
      "15yo HS sophomore who qualified for state with a 72 in district — solid trajectory, geographically reachable. At his age the conversation is recruitment-track; WSC's program fits if he wants college-level support.",
    contact_email: "mfernandez@example.com",
    contact_name: "Maria Fernandez",
    contact_relation: "mother",
    contact_confidence: 71,
    status: "drafted",
    draft_subject: "Lucas's 72 at districts — quick note",
    draft_body: `Hi Maria,

I'm Cooper Mostad at Woodinville Sports Club. Saw Lucas qualified for WIAA 4A state with a 72 at districts — that's a strong scorecard for a sophomore.

The conversation at this stage is usually about whether the next 18-24 months are tracking toward college recruitment or staying as a strong recreational player. Both are good — but they need different work, and I imagine that's something you and Lucas have probably started thinking about.

If it's useful, I'd like to offer a no-charge evaluation: TrackMan baseline, 60 minutes with our coaching team, and an honest read on the path forward. We've got the indoor setup (23-bay range, simulators) that lets juniors keep building through the wet months.

Reply with what works and I'll send a confirmation.

Best,
Cooper Mostad
Woodinville Sports Club Golf Academy`,
  },
];

async function main() {
  console.log("Seeding demo content for tournament reports + golf prospects…");

  // Find org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, slug")
    .eq("slug", DEMO_ORG_SLUG)
    .maybeSingle();
  if (orgErr || !org) {
    console.error(`  ${DEMO_ORG_SLUG} not found. Run \`npm run seed\` first.`);
    process.exit(1);
  }
  const orgId = org.id;

  // Find agents by type
  const { data: agentsRows } = await supabase
    .from("agents")
    .select("id, name, config")
    .eq("org_id", orgId);
  const agents = (agentsRows ?? []) as Array<{
    id: string;
    name: string;
    config: { type?: string };
  }>;

  const tournamentReportsAgent = agents.find(
    (a) => a.config?.type === "tournament_reports"
  );
  const golfLeadFinderAgent = agents.find(
    (a) => a.config?.type === "golf_lead_finder"
  );
  if (!tournamentReportsAgent) {
    console.warn("  tournament_reports agent missing — skipping reports.");
  }
  if (!golfLeadFinderAgent) {
    console.warn("  golf_lead_finder agent missing — skipping prospects.");
  }

  // Find students
  const { data: studentsRows } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("org_id", orgId);
  const students = (studentsRows ?? []) as Array<{ id: string; full_name: string }>;

  // ─── Tournament reports ───────────────────────────────────────────────
  if (tournamentReportsAgent) {
    console.log("  student_reports: clearing existing demo entries…");
    await supabase
      .from("student_reports")
      .delete()
      .eq("org_id", orgId)
      .eq("agent_id", tournamentReportsAgent.id);

    let inserted = 0;
    for (const seed of TENNIS_REPORTS) {
      const student = students.find((s) => s.full_name === seed.studentName);
      if (!student) {
        console.warn(`    student "${seed.studentName}" not found — skipping`);
        continue;
      }
      const { error } = await supabase.from("student_reports").insert({
        org_id: orgId,
        agent_id: tournamentReportsAgent.id,
        student_id: student.id,
        student_name_snapshot: seed.studentName,
        report_type: "tournament",
        body_markdown: seed.body_markdown,
        source_data: seed.source_data,
      });
      if (error) {
        console.error(`    insert ${seed.studentName} failed:`, error.message);
      } else {
        inserted++;
      }
    }
    console.log(`  student_reports: ${inserted} inserted ✓`);
  }

  // ─── Golf prospects ───────────────────────────────────────────────────
  if (golfLeadFinderAgent) {
    console.log("  prospects: clearing existing demo entries…");
    // Cascading: delete prospects for this agent → prospect_outreach rows
    // get cleaned up via FK on delete cascade in messages we DON'T have, so
    // we delete prospect_outreach explicitly first.
    const { data: existingProspects } = await supabase
      .from("prospects")
      .select("id")
      .eq("agent_id", golfLeadFinderAgent.id);
    const existingIds = (existingProspects ?? []).map((p) => p.id as string);
    if (existingIds.length > 0) {
      await supabase
        .from("prospect_outreach")
        .delete()
        .in("prospect_id", existingIds);
      await supabase
        .from("messages")
        .delete()
        .eq("agent_id", golfLeadFinderAgent.id);
    }
    await supabase.from("prospects").delete().eq("agent_id", golfLeadFinderAgent.id);

    let prospectsInserted = 0;
    for (const seed of GOLF_PROSPECTS) {
      // 1. Create prospect
      const { data: prospect, error: pErr } = await supabase
        .from("prospects")
        .insert({
          org_id: orgId,
          agent_id: golfLeadFinderAgent.id,
          full_name: seed.full_name,
          age: seed.age,
          age_band: seed.age_band,
          location: seed.location,
          signal_type: seed.signal_type,
          signal_summary: seed.signal_summary,
          signal_detail: seed.signal_detail,
          source_name: seed.source_name,
          source_url: seed.source_url,
          icp_score: seed.icp_score,
          icp_reasoning: seed.icp_reasoning,
          contact_email: seed.contact_email,
          contact_name: seed.contact_name,
          contact_relation: seed.contact_relation,
          contact_confidence: seed.contact_confidence,
          status: seed.status,
        })
        .select("id")
        .single();
      if (pErr || !prospect) {
        console.error(`    prospect ${seed.full_name} failed:`, pErr?.message);
        continue;
      }

      // 2. Create the drafted email message
      const { data: msg, error: mErr } = await supabase
        .from("messages")
        .insert({
          org_id: orgId,
          agent_id: golfLeadFinderAgent.id,
          direction: "outbound",
          channel: "email",
          status: "pending_approval",
          from_addr: "info@woodinvillesportsclub.com",
          to_addr: seed.contact_email,
          subject: seed.draft_subject,
          body: seed.draft_body,
        })
        .select("id")
        .single();
      if (mErr || !msg) {
        console.error(`    message for ${seed.full_name} failed:`, mErr?.message);
        continue;
      }

      // 3. Link via prospect_outreach
      const { error: oErr } = await supabase.from("prospect_outreach").insert({
        org_id: orgId,
        prospect_id: prospect.id,
        agent_id: golfLeadFinderAgent.id,
        message_id: msg.id,
        attempt_number: 1,
        channel: "email",
        outcome: "pending",
      });
      if (oErr) {
        console.error(`    outreach for ${seed.full_name} failed:`, oErr.message);
        continue;
      }

      prospectsInserted++;
    }
    console.log(`  prospects: ${prospectsInserted} inserted ✓`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
