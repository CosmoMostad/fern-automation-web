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

/* ──────────────────────────────────────────────────────────────────────
 * Live activity layer (migration 0002)
 * ──────────────────────────────────────────────────────────────────── */

export type MessageDirection = "inbound" | "outbound";
export type MessageChannel = "email" | "sms" | "voice";
export type MessageStatus =
  | "received"
  | "drafted"
  | "pending_approval"
  | "approved"
  | "sent"
  | "failed"
  | "escalated";

export type Message = {
  id: string;
  org_id: string;
  agent_id: string | null;
  thread_id: string | null;
  direction: MessageDirection;
  channel: MessageChannel;
  status: MessageStatus;
  from_addr: string | null;
  to_addr: string | null;
  subject: string | null;
  body: string | null;
  body_preview: string | null;
  external_id: string | null;
  llm_input: unknown;
  llm_output: unknown;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  error: string | null;
  created_at: string;
};

export type ThreadStatus = "open" | "closed" | "escalated";

export type Thread = {
  id: string;
  org_id: string;
  agent_id: string | null;
  subject: string | null;
  contact_email: string | null;
  contact_name: string | null;
  status: ThreadStatus;
  last_message_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type EscalationReason =
  | "low_confidence"
  | "requested_human"
  | "angry_tone"
  | "manual_flag"
  | "policy_block"
  | "other";

export type EscalationStatus = "open" | "claimed" | "resolved" | "dismissed";

export type Escalation = {
  id: string;
  org_id: string;
  agent_id: string | null;
  message_id: string | null;
  thread_id: string | null;
  reason: EscalationReason;
  reason_detail: string | null;
  status: EscalationStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
};

/* ──────────────────────────────────────────────────────────────────────
 * Knowledge layer (migration 0003)
 * ──────────────────────────────────────────────────────────────────── */

export type KnowledgeScope = "org" | "agent";

export type KnowledgeDoc = {
  id: string;
  org_id: string;
  agent_id: string | null;
  scope: KnowledgeScope;
  title: string;
  body: string;
  position: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeDocVersion = {
  id: string;
  doc_id: string;
  org_id: string;
  title: string;
  body: string;
  edited_by: string | null;
  edited_at: string;
};

export type KnowledgeExample = {
  id: string;
  org_id: string;
  agent_id: string;
  label: string;
  inbound: string | null;
  outbound: string;
  active: boolean;
  position: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Aggregated payload for the per-agent detail page. */
export type AgentDetailData = {
  org: Pick<Org, "id" | "slug" | "name" | "setup_status">;
  user: { id: string; display_name: string };
  agent: Agent;
  recent_messages: Message[];
  recent_threads: Thread[];
  open_escalations: Escalation[];
  org_knowledge: KnowledgeDoc[];
  agent_knowledge: KnowledgeDoc[];
  examples: KnowledgeExample[];
};
