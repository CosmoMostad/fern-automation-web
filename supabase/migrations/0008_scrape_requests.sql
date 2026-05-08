-- Fern Console — URL → scrape pipeline
-- Idempotent: safe to re-run.
--
-- The Knowledge tab (and Business profile) lets a client paste a URL and
-- have it crawled into knowledge_docs. Console inserts a scrape_requests
-- row; the Hetzner daemon (scrape_requests.py) picks it up, runs the
-- onboarder's site crawler, writes one knowledge_docs row per fetched
-- page, and marks the request done. The Console polls and reflects status.

drop table if exists public.scrape_requests cascade;

create table public.scrape_requests (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  -- Null agent_id = scrape into org-scope knowledge.
  -- Set agent_id  = scrape into that agent's knowledge.
  agent_id        uuid references public.agents(id) on delete cascade,
  scope           text not null check (scope in ('org', 'agent')),
  root_url        text not null check (length(root_url) > 0),
  -- "single" = fetch root_url only.
  -- "domain" = fetch root_url + crawl high-signal interior pages on the same host.
  mode            text not null default 'domain' check (mode in ('single', 'domain')),
  max_pages       int  not null default 10 check (max_pages > 0 and max_pages <= 50),

  status          text not null default 'pending' check (status in (
                    'pending',
                    'running',
                    'done',
                    'failed',
                    'cancelled'
                  )),
  error           text,
  -- Resulting knowledge_docs.id values, populated when status='done'
  doc_ids         uuid[] not null default '{}',
  -- Per-page outcome summary, e.g. {"fetched": 7, "failed": 1}
  result_summary  jsonb,

  requested_by    uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  claimed_by      text,

  -- Scope sanity: org-scope = null agent_id; agent-scope = required agent_id.
  check (
    (scope = 'org'   and agent_id is null) or
    (scope = 'agent' and agent_id is not null)
  )
);

create index scrape_requests_pending_idx
  on public.scrape_requests(created_at)
  where status = 'pending';

create index scrape_requests_org_idx
  on public.scrape_requests(org_id, created_at desc);

create index scrape_requests_agent_idx
  on public.scrape_requests(agent_id, created_at desc)
  where agent_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- knowledge_docs: track scrape provenance so re-scraping can replace prior docs
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.knowledge_docs
  add column if not exists source_url text;

alter table public.knowledge_docs
  add column if not exists source_kind text not null default 'manual'
  check (source_kind in ('manual', 'scrape'));

alter table public.knowledge_docs
  add column if not exists source_scrape_request_id uuid
  references public.scrape_requests(id) on delete set null;

create index if not exists knowledge_docs_source_scrape_idx
  on public.knowledge_docs(source_scrape_request_id)
  where source_scrape_request_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants + RLS
-- ─────────────────────────────────────────────────────────────────────────────

grant select         on public.scrape_requests to anon, authenticated;
grant select, insert on public.scrape_requests to authenticated;
grant all            on public.scrape_requests to service_role;

alter table public.scrape_requests enable row level security;

create policy "scrape_requests_select_member"
  on public.scrape_requests for select
  using (org_id in (select public.user_org_ids()));

create policy "scrape_requests_insert_member"
  on public.scrape_requests for insert
  with check (
    org_id in (select public.user_org_ids())
    and (requested_by is null or requested_by = auth.uid())
  );

-- Updates (status transitions, doc_ids fill-in) and deletes happen via
-- service-role only (the daemon).
