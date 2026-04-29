-- Fern Console initial schema
-- Multi-tenant: each business is an org. Users belong to one or more orgs via org_members.
-- All tenant data references org_id and is gated by RLS policies.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- One per business
create table public.orgs (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  setup_status text not null default 'ready' check (setup_status in ('ready', 'in-setup', 'live')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Membership: which auth users belong to which org and in what role
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

-- Agents: one per automated workflow
create table public.agents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  name         text not null,
  description  text,
  status       text not null default 'scoped' check (status in ('scoped', 'in-build', 'live', 'paused', 'archived')),
  config       jsonb not null default '{}',
  position     int not null default 0, -- display order
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index agents_org_id_idx on public.agents(org_id);
create index agents_org_status_idx on public.agents(org_id, status);

-- Each invocation/run of an agent
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

-- High-level activity feed entries (what shows in the console activity rail)
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

-- Requests submitted via the "Request a new agent" modal
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

-- Helper: which orgs does the current user belong to?
create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.org_members where user_id = auth.uid();
$$;

-- orgs: members of the org can read it; only owners can update
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

-- org_members: see your own memberships and members of orgs you belong to
create policy "org_members_select_self_or_org"
  on public.org_members for select
  using (
    user_id = auth.uid()
    or org_id in (select public.user_org_ids())
  );

create policy "org_members_insert_owner"
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

-- agents: visible to org members, modifiable by owners/admins
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

-- agent_runs: read-only for org members. Inserts come from service-role agent runtime.
create policy "agent_runs_select_member"
  on public.agent_runs for select
  using (org_id in (select public.user_org_ids()));

-- events: read-only for org members. Inserts come from service role.
create policy "events_select_member"
  on public.events for select
  using (org_id in (select public.user_org_ids()));

-- agent_requests: members can submit and read their own org's requests
create policy "agent_requests_select_member"
  on public.agent_requests for select
  using (
    org_id is null and user_id = auth.uid()
    or org_id in (select public.user_org_ids())
  );

create policy "agent_requests_insert_member"
  on public.agent_requests for insert
  with check (
    user_id = auth.uid()
    and (org_id is null or org_id in (select public.user_org_ids()))
  );
