/**
 * Preflight validator — checks whether an agent has everything it needs
 * to run, before the Console enables the Run button.
 *
 * Pure function. Inputs:
 *   - the agent's manifest (what it requires)
 *   - the agent's config (what's been filled in)
 *   - knowledge doc counts (org and agent scope)
 *
 * Output: { ok: true } or { ok: false, missing: [...] } where each missing
 * item carries a deep-link href so the UI can route the user straight to
 * the right tab.
 *
 * Server-side and client-side safe. No Supabase calls in here — the data
 * loader feeds it pre-fetched values so it stays trivially testable.
 */

import type { AgentManifest, ConnectionField } from "./manifest";

export type MissingItem =
  | {
      kind: "connection";
      path: string;
      label: string;
      sectionTitle: string;
      fixHref: string;
    }
  | {
      kind: "knowledge";
      scope: "org" | "agent";
      label: string;
      hint?: string;
      fixHref: string;
    };

export type PreflightResult =
  | { ok: true; missing: [] }
  | { ok: false; missing: MissingItem[] };

export type PreflightInput = {
  agentId: string;
  manifest: AgentManifest;
  config: Record<string, unknown>;
  /** Count of org-scoped knowledge docs available to the agent's org. */
  orgKnowledgeCount: number;
  /** Count of agent-scoped knowledge docs for this specific agent. */
  agentKnowledgeCount: number;
};

export function preflight(input: PreflightInput): PreflightResult {
  const missing: MissingItem[] = [];
  const base = `/console/agents/${input.agentId}`;

  for (const section of input.manifest.connections) {
    for (const field of section.fields) {
      if (!field.required) continue;
      if (isFilled(input.config, field)) continue;
      missing.push({
        kind: "connection",
        path: field.path,
        label: field.label,
        sectionTitle: section.title,
        fixHref: `${base}?tab=connections#${cssId(field.path)}`,
      });
    }
  }

  for (const req of input.manifest.requiredKnowledge ?? []) {
    const have = req.scope === "org" ? input.orgKnowledgeCount : input.agentKnowledgeCount;
    const need = req.minDocs ?? 1;
    if (have >= need) continue;
    missing.push({
      kind: "knowledge",
      scope: req.scope,
      label: req.label,
      hint: req.hint,
      fixHref: `${base}?tab=knowledge`,
    });
  }

  if (missing.length === 0) return { ok: true, missing: [] };
  return { ok: false, missing };
}

/**
 * Treats a connection field as "filled" if a non-empty value lives at its
 * dotted path. For url_list fields, the array must be non-empty. For other
 * kinds, an empty string or null counts as missing.
 */
function isFilled(
  config: Record<string, unknown>,
  field: ConnectionField,
): boolean {
  const value = getPath(config, field.path);
  if (value === undefined || value === null) return false;
  if (field.kind === "url_list") {
    if (Array.isArray(value)) return value.some((v) => typeof v === "string" && v.trim() !== "");
    if (typeof value === "string") return value.trim() !== "";
    return false;
  }
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return Boolean(value);
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Make a dotted path safe for use as an HTML id / URL fragment. */
function cssId(path: string): string {
  return `field-${path.replace(/\./g, "-")}`;
}
