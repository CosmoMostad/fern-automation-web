/**
 * Seeds a Demo Org for local dev / staging.
 *
 * Run with:
 *   npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS).
 * Idempotent: re-running won't duplicate rows.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
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
const DEMO_ORG_NAME = "Demo Sports Club";
const DEMO_USER_EMAIL = "demo@fernautomation.com";

const DEMO_AGENTS = [
  {
    name: "Intake & booking",
    description:
      "Handles incoming SMS booking requests, finds open slots, confirms.",
    status: "in-build" as const,
    position: 0,
  },
  {
    name: "No-show prevention",
    description: "Confirms tomorrow's bookings, reschedules if needed.",
    status: "in-build" as const,
    position: 1,
  },
  {
    name: "Feedback collection",
    description:
      "Sends short post-visit survey, summarizes themes weekly.",
    status: "scoped" as const,
    position: 2,
  },
  {
    name: "Member outreach",
    description: "Re-engages members who haven't visited in 30+ days.",
    status: "scoped" as const,
    position: 3,
  },
  {
    name: "Internal staff Slack",
    description: "Routes urgent messages to the right staff member.",
    status: "scoped" as const,
    position: 4,
  },
  {
    name: "Weekly owner report",
    description:
      "Monday morning email with the numbers from the week.",
    status: "scoped" as const,
    position: 5,
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

  // 2. Upsert org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .upsert(
      {
        slug: DEMO_ORG_SLUG,
        name: DEMO_ORG_NAME,
        setup_status: "in-setup",
      },
      { onConflict: "slug" }
    )
    .select("id, name, slug")
    .single();
  if (orgErr || !org) {
    throw new Error(`Failed to upsert org: ${orgErr?.message}`);
  }
  console.log(`  org: ${org.name} (${org.id})`);

  // 3. Membership
  const { error: memErr } = await supabase
    .from("org_members")
    .upsert(
      {
        org_id: org.id,
        user_id: userId,
        role: "owner",
        display_name: "Cooper",
      },
      { onConflict: "org_id,user_id" }
    );
  if (memErr) {
    throw new Error(`Failed to upsert membership: ${memErr.message}`);
  }
  console.log("  membership: ok");

  // 4. Agents — replace-style upsert by (org_id, position)
  // Easiest: delete then re-insert, since this is a demo seed
  await supabase.from("agents").delete().eq("org_id", org.id);
  const { error: agentErr } = await supabase.from("agents").insert(
    DEMO_AGENTS.map((a) => ({
      org_id: org.id,
      ...a,
    }))
  );
  if (agentErr) {
    throw new Error(`Failed to insert agents: ${agentErr.message}`);
  }
  console.log(`  agents: ${DEMO_AGENTS.length} inserted`);

  // 5. Don't seed events — pilot hasn't gone live yet, so the activity rail
  //    should show its empty state for the demo org.

  console.log("\nDone.");
  console.log(`Sign in as: ${DEMO_USER_EMAIL}`);
  console.log("(In Supabase auth dashboard, send a magic link to that address)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
