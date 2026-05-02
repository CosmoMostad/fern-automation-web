-- Fern Console initial schema
-- Idempotent: safe to re-run. Drops existing fern tables first, then rebuilds.
-- Multi-tenant: each business is an org. Users belong to orgs via org_members.
-- All tenant data is gated by RLS policies.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- DROP everything we own (in dependency order). Safe on a fresh project.
-- ─────────────────────────────────────────────────────────────────────────────

drop table if exists public.agent_requests cascade;
drop table if exists public.events cascade;
drop table if exists public.agent_runs cascade;
drop table if exists public.agents cascade;
drop table if exists public.org_members cascade;
drop table if exists public.orgs cascade;

drop function if exists public.user_org_ids() cascade;
drop function if exists public.set_updated_at() cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table public.orgs (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name         text not null,
  setup_status text not null default 'ready' check (setup_status in ('ready', 'in-setup', 'live')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.org_members (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'owner' check (role in ('owner', 'admin', 'staff', 'viewer')),
  display_name  text,
  created_at    timestamptz not null default now(),
  unique (org_id, user_id)
);

create index org_members_user_id_idx on public.org_members(user_id);
create index org_members_org_id_idx on public.org_members(org_id);

create table public.agents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  name         text not null,
  description  text,
  status       text not null default 'scoped' check (status in ('scoped', 'in-build', 'live', 'paused', 'archived')),
  config       jsonb not null default '{}',
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index agents_org_id_idx on public.agents(org_id);
create index agents_org_status_idx on public.agents(org_id, status);

create table public.agent_runs (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references public.agents(id) on delete cascade,
  org_id        uuid not null references public.orgs(id) on delete cascade,
  status        text not null check (status in ('pending', 'running', 'success', 'failed', 'needs-approval')),
  input         jsonb,
  output        jsonb,
  error         text,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index agent_runs_agent_id_idx on public.agent_runs(agent_id, started_at desc);
create index agent_runs_org_id_idx on public.agent_runs(org_id, started_at desc);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  agent_id    uuid references public.agents(id) on delete set null,
  type        text not null,
  summary     text not null,
  detail      text,
  created_at  timestamptz not null default now()
);

create index events_org_id_created_idx on public.events(org_id, created_at desc);

create table public.agent_requests (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.orgs(id) on delete set null,
  user_id     uuid references auth.users(id) on delete set null,
  kind        text not null,
  tools       text,
  urgency     text default 'no-rush' check (urgency in ('no-rush', 'this-month', 'this-week')),
  status      text not null default 'new' check (status in ('new', 'in-review', 'scoped', 'declined')),
  notes       text,
  created_at  timestamptz not null default now()
);

create index agent_requests_org_id_idx on public.agent_requests(org_id, created_at desc);
create index agent_requests_status_idx on public.agent_requests(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants — required so anon/authenticated roles can hit PostgREST.
-- RLS is the actual access control; these grants just unlock the door.
-- ─────────────────────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.orgs            to anon, authenticated;
grant select, insert, update, delete on public.org_members     to anon, authenticated;
grant select, insert, update, delete on public.agents          to anon, authenticated;
grant select                          on public.agent_runs     to anon, authenticated;
grant select                          on public.events         to anon, authenticated;
grant select, insert                  on public.agent_requests to anon, authenticated;

-- service_role bypasses RLS but still needs schema-level grants
grant all on public.orgs            to service_role;
grant all on public.org_members     to service_role;
grant all on public.agents          to service_role;
grant all on public.agent_runs      to service_role;
grant all on public.events          to service_role;
grant all on public.agent_requests  to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orgs_set_updated_at before update on public.orgs
  for each row execute function public.set_updated_at();

create trigger agents_set_updated_at before update on public.agents
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — multi-tenant isolation
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.agents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.events enable row level security;
alter table public.agent_requests enable row level security;

create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.org_members where user_id = auth.uid();
$$;

grant execute on function public.user_org_ids() to anon, authenticated;

-- orgs
create policy "orgs_select_member"
  on public.orgs for select
  using (id in (select public.user_org_ids()));

create policy "orgs_update_owner"
  on public.orgs for update
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- org_members
create policy "org_members_select_self_or_org"
  on public.org_members for select
  using (
    user_id = auth.uid()
    or org_id in (select public.user_org_ids())
  );

create policy "org_members_insert_owner_admin"
  on public.org_members for insert
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "org_members_delete_owner"
  on public.org_members for delete
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- agents
create policy "agents_select_member"
  on public.agents for select
  using (org_id in (select public.user_org_ids()));

create policy "agents_modify_admin"
  on public.agents for all
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  )
  with check (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- agent_runs (read-only via REST; runtime inserts use service_role)
create policy "agent_runs_select_member"
  on public.agent_runs for select
  using (org_id in (select public.user_org_ids()));

-- events (read-only via REST; runtime inserts use service_role)
create policy "events_select_member"
  on public.events for select
  using (org_id in (select public.user_org_ids()));

-- agent_requests
create policy "agent_requests_select_member"
  on public.agent_requests for select
  using (
    (org_id is null and user_id = auth.uid())
    or org_id in (select public.user_org_ids())
  );

create policy "agent_requests_insert_member"
  on public.agent_requests for insert
  with check (
    user_id = auth.uid()
    and (org_id is null or org_id in (select public.user_org_ids()))
  );
