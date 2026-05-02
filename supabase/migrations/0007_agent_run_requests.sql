-- Fern Console — On-demand agent run requests
-- Idempotent: safe to re-run.
--
-- The trigger spine for "Run now" buttons. Console inserts a row when the
-- user clicks Generate Report or Run Lead Finder. The Hetzner daemon
-- (run_requests.py) polls every 15s, picks pending rows up, executes the
-- right agent, writes the result back, marks status='done' (or 'failed').
-- Console polls the row id and shows progress in the UI.

drop table if exists public.agent_run_requests cascade;

create table public.agent_run_requests (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  agent_id        uuid not null references public.agents(id) on delete cascade,
  requested_by    uuid references auth.users(id) on delete set null,

  -- What the runner needs to do its job. Shape varies per agent type:
  --   tournament_reports → {"student_id": "uuid"} or {"name": "...", "age": ..., "location": "..."}
  --   golf_lead_finder   → {} (just runs)
  --   signal_hunter      → {} (just runs)
  -- For type-checking, the daemon dispatches based on agents.config.type.
  input_payload   jsonb not null default '{}',

  status          text not null default 'pending' check (status in (
                    'pending',     -- waiting for a daemon to pick it up
                    'running',     -- a daemon claimed it and is executing
                    'done',        -- finished, output in output_payload
                    'failed',      -- error, see `error` column
                    'cancelled'    -- user cancelled before runner picked it up
                  )),

  -- Agent-specific result. Examples:
  --   tournament_reports → {"report_id": "uuid"} (links to student_reports row)
  --   golf_lead_finder   → {"prospects_drafted": 7, "prospects_qualified": 12}
  output_payload  jsonb,
  error           text,

  -- Lifecycle timestamps — handy for the Console's progress UI ("queued for 4s, running for 11s")
  queued_at       timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz,

  -- Optimistic-lock token for daemons claiming pending rows (set when daemon
  -- atomically updates status pending → running). Stored as the daemon's
  -- hostname + pid for debugging.
  claimed_by      text
);

create index agent_run_requests_pending_idx
  on public.agent_run_requests(queued_at)
  where status = 'pending';

create index agent_run_requests_agent_idx
  on public.agent_run_requests(agent_id, queued_at desc);

create index agent_run_requests_org_idx
  on public.agent_run_requests(org_id, queued_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants + RLS
-- ─────────────────────────────────────────────────────────────────────────────

grant select         on public.agent_run_requests to anon, authenticated;
grant select, insert on public.agent_run_requests to authenticated;
grant all            on public.agent_run_requests to service_role;

alter table public.agent_run_requests enable row level security;

create policy "agent_run_requests_select_member"
  on public.agent_run_requests for select
  using (org_id in (select public.user_org_ids()));

create policy "agent_run_requests_insert_member"
  on public.agent_run_requests for insert
  with check (
    org_id in (select public.user_org_ids())
    and (requested_by is null or requested_by = auth.uid())
  );

-- Updates and deletes happen via service-role only (the daemon).
