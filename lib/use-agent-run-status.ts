"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AgentRunRequest,
  AgentRunRequestStatus,
} from "@/lib/supabase/types";

/**
 * Polls agent_run_requests for the given request id until it reaches a
 * terminal status (done | failed | cancelled). Used by every "Run now"
 * button to surface live progress in the UI.
 */
export function useAgentRunStatus(
  requestId: string | null,
  opts: { intervalMs?: number; onDone?: (req: AgentRunRequest) => void } = {}
): {
  status: AgentRunRequestStatus | null;
  request: AgentRunRequest | null;
  elapsedMs: number;
} {
  const intervalMs = opts.intervalMs ?? 2000;
  const [request, setRequest] = useState<AgentRunRequest | null>(null);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    if (!requestId) {
      setRequest(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const supabase = createSupabaseBrowserClient();

    async function tick() {
      if (cancelled) return;
      const { data } = await supabase
        .from("agent_run_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const r = data as AgentRunRequest;
        setRequest(r);
        if (r.status === "done" || r.status === "failed" || r.status === "cancelled") {
          opts.onDone?.(r);
          return;
        }
      }
      setTickCount((n) => n + 1);
      timer = setTimeout(tick, intervalMs);
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, intervalMs]);

  // Re-render on each tick so elapsedMs updates even between server polls
  useEffect(() => {
    if (!request) return;
    if (request.status === "done" || request.status === "failed") return;
    const t = setInterval(() => setTickCount((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [request]);

  let elapsedMs = 0;
  if (request) {
    const start = new Date(request.queued_at).getTime();
    elapsedMs = Date.now() - start;
  }
  // touch tickCount to prevent eslint unused warning
  void tickCount;

  return {
    status: request?.status ?? null,
    request,
    elapsedMs,
  };
}
