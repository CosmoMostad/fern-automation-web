/**
 * Demo data used as a fallback when Supabase env vars aren't set yet,
 * or when ?demo= is in the URL. Lets the prototype work end-to-end without
 * a database while we set up the real backend.
 */

import type { DashboardData } from "@/lib/supabase/types";

export const emptyDemo: DashboardData = {
  org: {
    id: "demo-empty",
    slug: "your-business",
    name: "Your business",
    setup_status: "ready",
  },
  user: { id: "demo-user-empty", display_name: "there" },
  agents: [],
  recent_events: [],
  todays_activity_count: 0,
  todays_replies_count: 0,
  avg_response_seconds: null,
};

export const wscDemo: DashboardData = {
  org: {
    id: "demo-wsc",
    slug: "wsc",
    name: "Woodinville Sports Club",
    setup_status: "in-setup",
  },
  user: { id: "demo-user-wsc", display_name: "Cooper" },
  agents: [
    {
      id: "wsc-a1",
      org_id: "demo-wsc",
      name: "Intake & booking",
      description:
        "Handles incoming SMS booking requests, finds open slots, confirms.",
      status: "in-build",
      config: {},
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wsc-a2",
      org_id: "demo-wsc",
      name: "No-show prevention",
      description:
        "Confirms tomorrow's bookings, reschedules if needed.",
      status: "in-build",
      config: {},
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wsc-a3",
      org_id: "demo-wsc",
      name: "Feedback collection",
      description:
        "Sends short post-visit survey, summarizes themes weekly.",
      status: "scoped",
      config: {},
      position: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wsc-a4",
      org_id: "demo-wsc",
      name: "Member outreach",
      description: "Re-engages members who haven't visited in 30+ days.",
      status: "scoped",
      config: {},
      position: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wsc-a5",
      org_id: "demo-wsc",
      name: "Internal staff Slack",
      description: "Routes urgent messages to the right staff member.",
      status: "scoped",
      config: {},
      position: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "wsc-a6",
      org_id: "demo-wsc",
      name: "Weekly owner report",
      description:
        "Monday morning email with the numbers from the week.",
      status: "scoped",
      config: {},
      position: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  recent_events: [],
  todays_activity_count: 0,
  todays_replies_count: 0,
  avg_response_seconds: null,
};
