/**
 * Seeds a Demo Org for local dev / staging — now with rich content so the
 * Console isn't visually empty.
 *
 * Run with:
 *   npm run seed
 *
 * Optional:
 *   SEED_OWNER_EMAIL=cosmo727@outlook.com npm run seed
 *     Adds the named user (must already exist in auth.users) as an owner
 *     of the demo org, so signing in with that email surfaces the demo data.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS).
 * Idempotent: re-running clears + re-inserts agent / message / knowledge rows.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_OWNER_EMAIL = process.env.SEED_OWNER_EMAIL?.toLowerCase().trim() || null;

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
const DEMO_ORG_NAME = "Demo Sports Club";
const DEMO_USER_EMAIL = "demo@fernautomation.com";

// `config.type` is the bridge between the runtime (Hetzner agent code in
// `agents/<type>/`) and the UI (display name shown in the Console).
// Without it, the agent runtime can't look up its agent_id at startup —
// the lookup_agent helper in shared/console_db.py joins on it.
const DEMO_AGENTS = [
  {
    name: "Intake & booking",
    description:
      "Handles incoming SMS booking requests, finds open slots, confirms.",
    status: "live" as const,
    position: 0,
    config: { type: "intake_booking" },
  },
  {
    name: "No-show prevention",
    description: "Confirms tomorrow's bookings, reschedules if needed.",
    status: "in-build" as const,
    position: 1,
    config: { type: "no_show_prevention" },
  },
  {
    name: "Feedback collection",
    description: "Sends short post-visit survey, summarizes themes weekly.",
    status: "scoped" as const,
    position: 2,
    config: { type: "feedback_collection" },
  },
  // The two below have real agent code on Hetzner — running them will
  // actually write rows back to Supabase via shared/console_db.py.
  {
    name: "Competitor watch",
    description:
      "Weekly scan of competitor websites for pricing, events, and openings; emails a recap to the owner.",
    status: "live" as const,
    position: 3,
    config: { type: "competitor_watch" },
  },
  {
    name: "Corporate event hunter",
    description:
      "Weekly scan of local business news for companies that might book private events; drafts cold outreach for approval.",
    status: "in-build" as const,
    position: 4,
    config: { type: "corporate_event_hunter" },
  },
  {
    name: "Weekly owner report",
    description: "Monday morning email with the numbers from the week.",
    status: "scoped" as const,
    position: 5,
    config: { type: "weekly_owner_report" },
  },
];

const ORG_KNOWLEDGE = [
  {
    title: "What we do",
    body: "Demo Sports Club is a multi-sport indoor facility on the Eastside. We run year-round programs in tennis, pickleball, volleyball, and basketball. Members and drop-ins welcome. Our edge is being the only club in the area open from 5am to 11pm, seven days a week.",
    position: 0,
  },
  {
    title: "Hours & location",
    body: "Hours: 5am – 11pm every day. Address: 12345 NE 124th St, Kirkland, WA. Phone: (425) 555-0140.",
    position: 1,
  },
  {
    title: "Voice & tone",
    body: "Warm and direct. We use first names. We don't apologize for things that aren't our fault. We don't use exclamation marks except when celebrating a member's milestone (first match, completing a clinic, etc.). Replies are short — usually 2–4 sentences.",
    position: 2,
  },
  {
    title: "Email signature",
    body: "Sincerely,\nThe Demo Sports Club team\nwww.demosportsclub.com",
    position: 3,
  },
];

const INTAKE_AGENT_KNOWLEDGE = [
  {
    title: "Booking policy",
    body: "Members may book up to 14 days in advance, drop-ins up to 7. Court holds are 15 minutes — after that, the slot is released. We don't take bookings shorter than 60 minutes.",
    position: 0,
  },
  {
    title: "Membership tiers",
    body: "Tier 1 (full member, $189/mo): unlimited court time, free clinics, 1 guest pass per visit.\nTier 2 (off-peak, $129/mo): 5am–4pm M–F + after 8pm any day.\nDrop-in: $30/visit, no advance booking longer than 7 days.",
    position: 1,
  },
  {
    title: "When to escalate",
    body: "Escalate to a human if: (1) member is asking about billing or refunds, (2) the request involves a medical exemption, (3) the request mentions another member by name in a complaint, (4) you can't find a slot that works in the next 14 days.",
    position: 2,
  },
];

const INTAKE_EXAMPLES = [
  {
    label: "first_time_dropin",
    inbound:
      "Hi - is your tennis court open Saturday morning? Looking for 2 hours with my dad, never been there before.",
    outbound:
      "Hi — yes, we have openings Saturday morning. The closest 2-hour block is 8am–10am on court 3. Drop-in is $30 per person and you can pay at the front desk when you arrive. Just reply with your last name to confirm and I'll hold the slot.",
    position: 0,
  },
  {
    label: "tier1_priority_request",
    inbound:
      "I'd like to book court 1 next Tuesday 6–8pm. Tier 1 member, last name Suzuki.",
    outbound:
      "Hi — court 1 is yours, Tuesday 6–8pm. I've also added it to your booking calendar. See you then.",
    position: 1,
  },
];

type DemoMsg = {
  direction: "inbound" | "outbound";
  status:
    | "received"
    | "drafted"
    | "pending_approval"
    | "approved"
    | "sent"
    | "escalated";
  from_addr: string | null;
  to_addr: string | null;
  subject: string;
  body: string;
  thread_key: string;
  hours_ago: number;
};

const DEMO_MESSAGES: DemoMsg[] = [
  // Thread A: simple booking confirmation, complete
  {
    direction: "inbound",
    status: "received",
    from_addr: "sarah.k@example.com",
    to_addr: "info@demosportsclub.com",
    subject: "Saturday morning tennis?",
    body: "Hi - is your tennis court open Saturday morning? Looking for 2 hours with my dad, never been there before.",
    thread_key: "saturday-tennis",
    hours_ago: 22,
  },
  {
    direction: "outbound",
    status: "sent",
    from_addr: "info@demosportsclub.com",
    to_addr: "sarah.k@example.com",
    subject: "Re: Saturday morning tennis?",
    body: "Hi Sarah — yes, we have openings Saturday morning. The closest 2-hour block is 8am–10am on court 3. Drop-in is $30 per person and you can pay at the front desk when you arrive. Just reply with your last name to confirm and I'll hold the slot.",
    thread_key: "saturday-tennis",
    hours_ago: 21,
  },
  {
    direction: "inbound",
    status: "received",
    from_addr: "sarah.k@example.com",
    to_addr: "info@demosportsclub.com",
    subject: "Re: Saturday morning tennis?",
    body: "Perfect - Kowalski, thank you!",
    thread_key: "saturday-tennis",
    hours_ago: 20,
  },
  // Thread B: pending approval (the centerpiece — Cooper would click Approve here)
  {
    direction: "inbound",
    status: "received",
    from_addr: "marcus.b@example.com",
    to_addr: "info@demosportsclub.com",
    subject: "Wedding inquiry?",
    body: "Hi, my fiancée and I are getting married in October. We're looking at outdoor venues but considering indoor backup options for the reception (~80 guests). Do you do that kind of event rental? Approximate cost?",
    thread_key: "wedding-inquiry",
    hours_ago: 4,
  },
  {
    direction: "outbound",
    status: "pending_approval",
    from_addr: "info@demosportsclub.com",
    to_addr: "marcus.b@example.com",
    subject: "Re: Wedding inquiry?",
    body: "Hi Marcus — congrats on the engagement. We do host private events on Sunday evenings when court traffic is lower. For 80 guests, the gymnasium is the right space — capacity is 120, with full setup we can include tables, chairs, and an AV bar. Pricing depends on length and add-ons; happy to send a proposal once I know the date you're looking at and roughly when the reception runs (start time, expected end). What date are you targeting?",
    thread_key: "wedding-inquiry",
    hours_ago: 3,
  },
  // Thread C: escalated (pricing question outside agent scope)
  {
    direction: "inbound",
    status: "escalated",
    from_addr: "ericapardo@example.com",
    to_addr: "info@demosportsclub.com",
    subject: "Refund — knee surgery",
    body: "Hi, I'm a Tier 1 member but I'm scheduled for knee surgery next week and won't be able to use the club for 8–12 weeks. Is there a medical-pause option that doesn't charge me during recovery? I tried calling but no one picked up.",
    thread_key: "medical-pause",
    hours_ago: 7,
  },
  // Thread D: drafted, waiting for more info
  {
    direction: "inbound",
    status: "received",
    from_addr: "team@bellevuesoftball.org",
    to_addr: "info@demosportsclub.com",
    subject: "Group booking — adult softball league",
    body: "Hello — we're a 10-team adult softball league looking for an indoor practice space for January (our outdoor season ends in October and we want to keep practicing). Could we book 3 hours every Wednesday evening for 10 weeks?",
    thread_key: "softball-league",
    hours_ago: 30,
  },
  {
    direction: "outbound",
    status: "drafted",
    from_addr: "info@demosportsclub.com",
    to_addr: "team@bellevuesoftball.org",
    subject: "Re: Group booking — adult softball league",
    body: "Hi — yes, we can support this. Wednesday evenings in Jan look clear from 6:30pm onward in our gym (~120ft × 80ft, no batting cages but plenty for fielding/catching practice). 10 weeks × 3 hours at our group rate works out to roughly $X total. Want me to put a hold on those dates while you check with the league?",
    thread_key: "softball-league",
    hours_ago: 29,
  },
  // Thread E: simple sent confirmations from earlier in the day
  {
    direction: "inbound",
    status: "received",
    from_addr: "j.suzuki@example.com",
    to_addr: "info@demosportsclub.com",
    subject: "Court 1 — Tuesday 6pm",
    body: "I'd like to book court 1 next Tuesday 6–8pm. Tier 1 member, last name Suzuki.",
    thread_key: "suzuki-court",
    hours_ago: 11,
  },
  {
    direction: "outbound",
    status: "sent",
    from_addr: "info@demosportsclub.com",
    to_addr: "j.suzuki@example.com",
    subject: "Re: Court 1 — Tuesday 6pm",
    body: "Hi Junpei — court 1 is yours, Tuesday 6–8pm. I've also added it to your booking calendar. See you then.",
    thread_key: "suzuki-court",
    hours_ago: 11,
  },
];

async function main() {
  console.log("Seeding Demo Org…");

  // 1. Create / find demo user
  let userId: string;
  {
    const { data: existing } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = existing?.users?.find(
      (u) => u.email?.toLowerCase() === DEMO_USER_EMAIL
    );
    if (found) {
      userId = found.id;
      console.log(`  user: reusing existing ${DEMO_USER_EMAIL} (${userId})`);
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: DEMO_USER_EMAIL,
        email_confirm: true,
        user_metadata: { display_name: "Cooper" },
      });
      if (error || !created.user) {
        throw new Error(`Failed to create demo user: ${error?.message}`);
      }
      userId = created.user.id;
      console.log(`  user: created ${DEMO_USER_EMAIL} (${userId})`);
    }
  }

  // 1b. Optionally pull in a real auth user (e.g. Cosmo's) as a co-owner
  let extraOwnerId: string | null = null;
  if (SEED_OWNER_EMAIL) {
    const { data: existing } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = existing?.users?.find(
      (u) => u.email?.toLowerCase() === SEED_OWNER_EMAIL
    );
    if (found) {
      extraOwnerId = found.id;
      console.log(`  extra owner: ${SEED_OWNER_EMAIL} (${extraOwnerId})`);
    } else {
      console.warn(
        `  warn: SEED_OWNER_EMAIL=${SEED_OWNER_EMAIL} not found in auth.users — skip adding as owner. They need to log in via magic link first, then re-run.`
      );
    }
  }

  // 2. Upsert org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .upsert(
      { slug: DEMO_ORG_SLUG, name: DEMO_ORG_NAME, setup_status: "live" },
      { onConflict: "slug" }
    )
    .select("id, name, slug")
    .single();
  if (orgErr || !org) throw new Error(`org: ${orgErr?.message}`);
  console.log(`  org: ${org.name} (${org.id})`);

  // 3. Memberships
  const memberRows = [
    {
      org_id: org.id,
      user_id: userId,
      role: "owner" as const,
      display_name: "Cooper",
    },
  ];
  if (extraOwnerId) {
    memberRows.push({
      org_id: org.id,
      user_id: extraOwnerId,
      role: "owner",
      display_name: "Cosmo",
    });
  }
  const { error: memErr } = await supabase
    .from("org_members")
    .upsert(memberRows, { onConflict: "org_id,user_id" });
  if (memErr) throw new Error(`memberships: ${memErr.message}`);
  console.log(`  memberships: ${memberRows.length} ok`);

  // 4. Agents — replace
  await supabase.from("agents").delete().eq("org_id", org.id);
  const { data: agentsInserted, error: agentErr } = await supabase
    .from("agents")
    .insert(DEMO_AGENTS.map((a) => ({ org_id: org.id, ...a })))
    .select("id, name, position");
  if (agentErr || !agentsInserted) throw new Error(`agents: ${agentErr?.message}`);
  console.log(`  agents: ${agentsInserted.length} inserted`);

  const intakeAgent = agentsInserted.find((a) => a.name === "Intake & booking");
  if (!intakeAgent) throw new Error("intake agent missing after insert");

  // 5. Org-level knowledge
  await supabase.from("knowledge_docs").delete().eq("org_id", org.id);
  const { error: orgKnowErr } = await supabase.from("knowledge_docs").insert(
    ORG_KNOWLEDGE.map((d) => ({
      org_id: org.id,
      agent_id: null,
      scope: "org",
      title: d.title,
      body: d.body,
      position: d.position,
      created_by: userId,
      updated_by: userId,
    }))
  );
  if (orgKnowErr) throw new Error(`org knowledge: ${orgKnowErr.message}`);
  console.log(`  org knowledge: ${ORG_KNOWLEDGE.length} docs`);

  // 6. Agent-scoped knowledge for Intake
  const { error: agentKnowErr } = await supabase.from("knowledge_docs").insert(
    INTAKE_AGENT_KNOWLEDGE.map((d) => ({
      org_id: org.id,
      agent_id: intakeAgent.id,
      scope: "agent",
      title: d.title,
      body: d.body,
      position: d.position,
      created_by: userId,
      updated_by: userId,
    }))
  );
  if (agentKnowErr) throw new Error(`agent knowledge: ${agentKnowErr.message}`);
  console.log(`  intake knowledge: ${INTAKE_AGENT_KNOWLEDGE.length} docs`);

  // 7. Few-shot examples for Intake
  await supabase.from("knowledge_examples").delete().eq("org_id", org.id);
  const { error: exErr } = await supabase.from("knowledge_examples").insert(
    INTAKE_EXAMPLES.map((e) => ({
      org_id: org.id,
      agent_id: intakeAgent.id,
      label: e.label,
      inbound: e.inbound,
      outbound: e.outbound,
      active: true,
      position: e.position,
      created_by: userId,
      updated_by: userId,
    }))
  );
  if (exErr) throw new Error(`examples: ${exErr.message}`);
  console.log(`  intake examples: ${INTAKE_EXAMPLES.length}`);

  // 8. Threads + Messages — wipe and re-create
  await supabase.from("escalations").delete().eq("org_id", org.id);
  await supabase.from("messages").delete().eq("org_id", org.id);
  await supabase.from("threads").delete().eq("org_id", org.id);

  // Group messages by thread_key
  const threadMap = new Map<string, string>(); // thread_key -> thread_id
  const threadFirstMsg = new Map<string, DemoMsg>();
  for (const m of DEMO_MESSAGES) {
    if (!threadFirstMsg.has(m.thread_key)) threadFirstMsg.set(m.thread_key, m);
  }

  for (const [key, m] of threadFirstMsg) {
    const contactEmail = m.direction === "inbound" ? m.from_addr : m.to_addr;
    const contactName = contactEmail?.split("@")[0]?.replace(/[._]/g, " ");
    const status = key === "medical-pause" ? "escalated" : "open";
    const { data: thread, error: threadErr } = await supabase
      .from("threads")
      .insert({
        org_id: org.id,
        agent_id: intakeAgent.id,
        subject: m.subject,
        contact_email: contactEmail,
        contact_name: contactName,
        status,
      })
      .select("id")
      .single();
    if (threadErr || !thread) throw new Error(`thread: ${threadErr?.message}`);
    threadMap.set(key, thread.id);
  }

  // Insert messages in chronological order (oldest first) so thread.message_count
  // and thread.last_message_at increment correctly via trigger
  const sortedMessages = [...DEMO_MESSAGES].sort((a, b) => b.hours_ago - a.hours_ago);
  let insertedMsgCount = 0;
  let pendingMsgId: string | null = null;
  let escalatedMsgId: string | null = null;
  for (const m of sortedMessages) {
    const createdAt = new Date(Date.now() - m.hours_ago * 3600 * 1000).toISOString();
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        org_id: org.id,
        agent_id: intakeAgent.id,
        thread_id: threadMap.get(m.thread_key),
        direction: m.direction,
        channel: "email",
        status: m.status,
        from_addr: m.from_addr,
        to_addr: m.to_addr,
        subject: m.subject,
        body: m.body,
        sent_at: m.status === "sent" ? createdAt : null,
        created_at: createdAt,
      })
      .select("id, status")
      .single();
    if (error) throw new Error(`message: ${error.message}`);
    insertedMsgCount++;
    if (row.status === "pending_approval") pendingMsgId = row.id;
    if (row.status === "escalated") escalatedMsgId = row.id;
  }
  console.log(`  threads: ${threadMap.size}, messages: ${insertedMsgCount}`);

  // 9. One open escalation
  if (escalatedMsgId) {
    const { error: escErr } = await supabase.from("escalations").insert({
      org_id: org.id,
      agent_id: intakeAgent.id,
      message_id: escalatedMsgId,
      reason: "policy_block",
      reason_detail:
        "Member is asking about a medical pause. Per the agent's escalation policy, billing/refund/medical questions go to a human.",
    });
    if (escErr) throw new Error(`escalation: ${escErr.message}`);
    console.log("  escalations: 1 open");
  }

  // 10. A handful of activity events
  await supabase.from("events").delete().eq("org_id", org.id);
  const events = [
    {
      type: "reply_sent",
      summary: "Replied to Sarah K. about Saturday tennis availability",
      hours_ago: 21,
    },
    {
      type: "draft_created",
      summary: "Drafted reply to Marcus B. (wedding inquiry) — pending approval",
      hours_ago: 3,
    },
    {
      type: "escalated",
      summary: "Escalated Erica Pardo's medical-pause request to human",
      hours_ago: 7,
    },
    {
      type: "reply_sent",
      summary: "Confirmed Junpei Suzuki's court 1 booking for Tuesday 6–8pm",
      hours_ago: 11,
    },
    {
      type: "knowledge_updated",
      summary: "Updated agent knowledge: Booking policy",
      hours_ago: 32,
    },
  ];
  await supabase.from("events").insert(
    events.map((e) => ({
      org_id: org.id,
      agent_id: intakeAgent.id,
      type: e.type,
      summary: e.summary,
      created_at: new Date(Date.now() - e.hours_ago * 3600 * 1000).toISOString(),
    }))
  );
  console.log(`  events: ${events.length}`);

  console.log("\nDone.");
  console.log("---");
  console.log(`Demo org slug: ${DEMO_ORG_SLUG}`);
  console.log(`Sign in as: ${DEMO_USER_EMAIL}`);
  if (extraOwnerId) {
    console.log(`Or sign in as: ${SEED_OWNER_EMAIL} (also an owner)`);
  } else {
    console.log(
      `(Tip: pass SEED_OWNER_EMAIL=<your-email> to also add yourself as an owner)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
