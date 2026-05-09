/**
 * Shared queue helpers for the URL → scrape pipeline.
 *
 * Server actions in two places call into here:
 *   - app/console/agents/[id]/actions.ts    (agent-scope scrapes)
 *   - app/console/settings/business/actions.ts (org-scope scrapes)
 *
 * Each action layer wraps these and handles its own revalidatePath().
 */

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ScrapeRequestMode } from "@/lib/supabase/types";

export type EnqueueScrapeInput = {
  orgId: string;
  url: string;
  mode?: ScrapeRequestMode;
  maxPages?: number;
  // Required for agent-scope; omit / null for org-scope.
  agentId?: string | null;
};

export type EnqueueScrapeResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

const DEFAULT_MAX_PAGES = 25;
const HARD_MAX_PAGES = 100;

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Allow users to paste "woodinvillesportsclub.com" — auto-prefix scheme.
  const withScheme =
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    // Reject obviously bad inputs (no host, non-http schemes, etc.)
    if (!u.host || (u.protocol !== "http:" && u.protocol !== "https:")) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

export async function enqueueScrapeRequest(
  input: EnqueueScrapeInput
): Promise<EnqueueScrapeResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase isn't connected." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const url = normalizeUrl(input.url);
  if (!url) {
    return { ok: false, error: "Enter a valid URL (e.g. example.com)." };
  }

  // Read-gate via RLS — if the user can read the org, they belong to it.
  const { data: org } = await supabase
    .from("orgs")
    .select("id")
    .eq("id", input.orgId)
    .maybeSingle();
  if (!org) return { ok: false, error: "Org not found or no access." };

  const scope: "org" | "agent" = input.agentId ? "agent" : "org";
  if (scope === "agent" && input.agentId) {
    // Confirm the agent belongs to this org (RLS enforces it; we double-check
    // for a clearer error message than a generic insert failure).
    const { data: agent } = await supabase
      .from("agents")
      .select("id, org_id")
      .eq("id", input.agentId)
      .maybeSingle();
    if (!agent || agent.org_id !== input.orgId) {
      return { ok: false, error: "Agent not in this org." };
    }
  }

  const mode: ScrapeRequestMode = input.mode ?? "domain";
  const maxPages = Math.max(
    1,
    Math.min(input.maxPages ?? DEFAULT_MAX_PAGES, HARD_MAX_PAGES)
  );

  const admin = createSupabaseServiceRoleClient();
  const { data: row, error } = await admin
    .from("scrape_requests")
    .insert({
      org_id: input.orgId,
      agent_id: input.agentId ?? null,
      scope,
      root_url: url,
      mode,
      max_pages: maxPages,
      requested_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "Failed to queue scrape." };
  }
  return { ok: true, requestId: row.id as string };
}

export type CancelScrapeInput = { requestId: string };
export type CancelScrapeResult = { ok: true } | { ok: false; error: string };

/**
 * Hard-delete a scrape_requests row that's already in a terminal state
 * (done / failed / cancelled). Used for the "Dismiss" button so users
 * can clean up bad URLs / stale results from the Knowledge tab list.
 *
 * Refuses to dismiss a pending/running row — those should be cancelled
 * via cancelScrapeRequestById instead.
 */
export async function dismissScrapeRequestById(
  input: CancelScrapeInput
): Promise<CancelScrapeResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase isn't connected." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // RLS read-gate confirms the user belongs to this row's org.
  const { data: row } = await supabase
    .from("scrape_requests")
    .select("id, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Request not found or no access." };

  const TERMINAL: Array<typeof row.status> = ["done", "failed", "cancelled"];
  if (!TERMINAL.includes(row.status)) {
    return {
      ok: false,
      error: "Use Cancel for in-flight scrapes, not Dismiss.",
    };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("scrape_requests")
    .delete()
    .eq("id", input.requestId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cancelScrapeRequestById(
  input: CancelScrapeInput
): Promise<CancelScrapeResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase isn't connected." };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Read-gate via RLS — only members see their org's rows.
  const { data: row } = await supabase
    .from("scrape_requests")
    .select("id, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Request not found or no access." };
  if (row.status !== "pending") {
    // Once running/done/failed, cancellation is meaningless. Hide the button.
    return { ok: false, error: `Cannot cancel a ${row.status} request.` };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("scrape_requests")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending"); // race-safe: don't override a daemon claim
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
