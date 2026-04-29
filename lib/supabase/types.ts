/**
 * Hand-written types matching supabase/migrations/0001_initial_schema.sql.
 * Once we have the Supabase project up, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
 * and replace this file.
 */

export type AgentStatus =
  | "scoped"
  | "in-build"
  | "live"
  | "paused"
  | "archived";

export type SetupStatus = "ready" | "in-setup" | "live";

export type OrgRole = "owner" | "admin" | "staff" | "viewer";

export type AgentRunStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "needs-approval";

export type RequestStatus = "new" | "in-review" | "scoped" | "declined";
export type RequestUrgency = "no-rush" | "this-month" | "this-week";

export type Org = {
  id: string;
  slug: string;
  name: string;
  setup_status: SetupStatus;
  created_at: string;
  updated_at: string;
};

export type OrgMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  display_name: string | null;
  created_at: string;
};

export type Agent = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: AgentStatus;
  config: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
};

export type AgentRun = {
  id: string;
  agent_id: string;
  org_id: string;
  status: AgentRunStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  started_at: string;
  completed_at: string | null;
};

export type Event = {
  id: string;
  org_id: string;
  agent_id: string | null;
  type: string;
  summary: string;
  detail: string | null;
  created_at: string;
};

export type AgentRequest = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  kind: string;
  tools: string | null;
  urgency: RequestUrgency;
  status: RequestStatus;
  notes: string | null;
  created_at: string;
};

/** Aggregated dashboard payload that the Dashboard component takes. */
export type DashboardData = {
  org: Pick<Org, "id" | "slug" | "name" | "setup_status">;
  user: { id: string; display_name: string };
  agents: Agent[];
  recent_events: Event[];
  todays_activity_count: number;
  todays_replies_count: number;
  avg_response_seconds: number | null;
};
