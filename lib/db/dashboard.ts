/**
 * Dashboard data loader.
 *
 * Strategy:
 *   1. If `demo` param is given (e.g. ?demo=wsc), return the matching demo state.
 *   2. If Supabase env isn't configured yet, return the empty demo state.
 *   3. Otherwise, query Supabase for the signed-in user's first org and its agents.
 *      If the user is signed in but has no org, return empty demo with their name.
 *      If not signed in, the middleware should have already redirected to /console/login.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyDemo, wscDemo } from "./demo";
import type { DashboardData, Agent, Event } from "@/lib/supabase/types";

export async function getDashboardData(opts: {
  demo: string | null;
}): Promise<DashboardData> {
  const { demo } = opts;

  if (demo === "wsc") return wscDemo;
  if (demo === "empty") return emptyDemo;

  if (!isSupabaseConfigured()) {
    return emptyDemo;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Should not happen if middleware is doing its job, but be defensive.
    return emptyDemo;
  }

  // Pick the first org the user is a member of.
  // Multi-org switching can come later via a header dropdown.
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    // Authed user with no org yet — show the empty demo with their email-based name.
    return {
      ...emptyDemo,
      user: {
        id: user.id,
        display_name:
          (user.user_metadata?.display_name as string | undefined) ??
          user.email?.split("@")[0] ??
          "there",
      },
    };
  }

  const { data: org } = await supabase
    .from("orgs")
    .select("id, slug, name, setup_status")
    .eq("id", membership.org_id)
    .single();

  if (!org) return emptyDemo;

  const { data: agents } = await supabase
    .from("agents")
    .select(
      "id, org_id, name, description, status, config, position, created_at, updated_at"
    )
    .eq("org_id", org.id)
    .order("position", { ascending: true });

  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, org_id, agent_id, type, summary, detail, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Counts — done with separate count queries to keep it simple.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();

  const { count: todaysActivityCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .gte("created_at", startIso);

  const { count: todaysRepliesCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("type", "reply_sent")
    .gte("created_at", startIso);

  return {
    org: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      setup_status: org.setup_status,
    },
    user: {
      id: user.id,
      display_name:
        membership.display_name ??
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "there",
    },
    agents: (agents ?? []) as Agent[],
    recent_events: (recentEvents ?? []) as Event[],
    todays_activity_count: todaysActivityCount ?? 0,
    todays_replies_count: todaysRepliesCount ?? 0,
    avg_response_seconds: null, // wire up once we have run-completion data
  };
}
