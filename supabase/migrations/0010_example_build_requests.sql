-- Fern Console — Gmail → knowledge_examples build pipeline
-- Idempotent: safe to re-run.
--
-- The Examples tab on each agent gets a "Build from past Gmail replies"
-- button. Clicking it inserts an example_build_requests row; the Hetzner
-- daemon (example_requests.py) decrypts the agent's Gmail token, scans
-- Sent for the lookback window, pairs each reply with its incoming
-- counterpart, dedups against gmail_message_id, labels the new ones with
-- Haiku, and inserts knowledge_examples rows. The Console polls and
-- reflects status, identical to the scrape_requests UX.

drop table if exists public.example_build_requests cascade;

create table public.example_build_requests (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  -- Always agent-scoped: examples belong to one agent's voice.
  agent_id        uuid not null references public.agents(id) on delete cascade,
  -- How far back to scan Sent. Bounded for cost + Gmail API quota.
  lookback_days   int not null default 90 check (lookback_days > 0 and lookback_days <= 365),
  -- Cap on new examples inserted in this run. Daemon stops once it hits this
  -- after dedup, so a re-run with a longer lookback won't blow past it.
  max_examples    int not null default 25 check (max_examples > 0 and max_examples <= 100),

  status          text not null default 'pending' check (status in (
                    'pending',
                    'running',
                    'done',
                    'failed',
                    'cancelled'
                  )),
  error           text,
  -- knowledge_examples.id values populated when status='done'
  example_ids     uuid[] not null default '{}',
  -- e.g. {"scanned": 412, "pairs_found": 47, "saved": 25, "skipped_duplicates": 18}
  result_summary  jsonb,

  requested_by    uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  claimed_by      text
);

create index example_build_requests_pending_idx
  on public.example_build_requests(created_at)
  where status = 'pending';

create index example_build_requests_agent_idx
  on public.example_build_requests(agent_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- knowledge_examples: track Gmail-import provenance for dedup + display
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.knowledge_examples
  add column if not exists source text not null default 'manual'
  check (source in ('manual', 'gmail_import'));

alter table public.knowledge_examples
  add column if not exists source_request_id uuid
  references public.example_build_requests(id) on delete set null;

-- Stable Gmail message ID of the SENT reply. Used by the daemon to skip
-- already-imported messages on re-run, so we don't pay for tokens twice
-- and don't insert duplicate rows.
alter table public.knowledge_examples
  add column if not exists gmail_message_id text;

create unique index if not exists knowledge_examples_gmail_dedup_idx
  on public.knowledge_examples(agent_id, gmail_message_id)
  where gmail_message_id is not null;

create index if not exists knowledge_examples_source_request_idx
  on public.knowledge_examples(source_request_id)
  where source_request_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants + RLS
-- ─────────────────────────────────────────────────────────────────────────────

grant select         on public.example_build_requests to anon, authenticated;
grant select, insert on public.example_build_requests to authenticated;
grant all            on public.example_build_requests to service_role;

alter table public.example_build_requests enable row level security;

create policy "example_build_requests_select_member"
  on public.example_build_requests for select
  using (org_id in (select public.user_org_ids()));

create policy "example_build_requests_insert_member"
  on public.example_build_requests for insert
  with check (
    org_id in (select public.user_org_ids())
    and (requested_by is null or requested_by = auth.uid())
  );

-- Updates (status transitions) and deletes happen via service-role only
-- (the daemon, plus the Console's "Dismiss" button on terminal-state rows).
