-- Fern Console — knowledge layer
-- Idempotent: safe to re-run.
-- Two scopes: 'org' (shared base layer, every agent in the org sees it)
--             'agent' (specific to one agent_id; isolated from sibling agents)
-- Edit history captured automatically on every update via trigger.

drop table if exists public.knowledge_doc_versions cascade;
drop table if exists public.knowledge_examples cascade;
drop table if exists public.knowledge_docs cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- knowledge_docs — the per-org / per-agent fact bank
-- ─────────────────────────────────────────────────────────────────────────────

create table public.knowledge_docs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  agent_id    uuid references public.agents(id) on delete cascade,
  scope       text not null check (scope in ('org', 'agent')),
  title       text not null,
  body        text not null default '',
  position    int  not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Scope sanity: org-level docs have null agent_id; agent-level docs require agent_id.
  constraint knowledge_docs_scope_check
    check (
      (scope = 'org'   and agent_id is null) or
      (scope = 'agent' and agent_id is not null)
    )
);

create index knowledge_docs_org_id_idx     on public.knowledge_docs(org_id, scope, position);
create index knowledge_docs_agent_id_idx   on public.knowledge_docs(agent_id, position);

-- ─────────────────────────────────────────────────────────────────────────────
-- knowledge_doc_versions — full edit history, append-only
-- One row written automatically every time a knowledge_doc is updated.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.knowledge_doc_versions (
  id          uuid primary key default gen_random_uuid(),
  doc_id      uuid not null references public.knowledge_docs(id) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  title       text not null,
  body        text not null,
  edited_by   uuid references auth.users(id) on delete set null,
  edited_at   timestamptz not null default now()
);

create index knowledge_doc_versions_doc_id_idx on public.knowledge_doc_versions(doc_id, edited_at desc);
create index knowledge_doc_versions_org_id_idx on public.knowledge_doc_versions(org_id, edited_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- knowledge_examples — few-shot email examples (always agent-scoped)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.knowledge_examples (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  agent_id    uuid not null references public.agents(id) on delete cascade,
  label       text not null,
  inbound     text,                              -- example incoming msg (nullable)
  outbound    text not null,                     -- the desired-style response
  active      boolean not null default true,
  position    int not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index knowledge_examples_agent_id_idx on public.knowledge_examples(agent_id, position);
create index knowledge_examples_org_id_idx   on public.knowledge_examples(org_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- updated_at on docs and examples
create trigger knowledge_docs_set_updated_at before update on public.knowledge_docs
  for each row execute function public.set_updated_at();

create trigger knowledge_examples_set_updated_at before update on public.knowledge_examples
  for each row execute function public.set_updated_at();

-- Edit history: snapshot the OLD row into knowledge_doc_versions on every update.
-- Only fires if title or body actually changed (skip cosmetic position bumps).
-- SECURITY DEFINER so the trigger can write version rows even though end-users
-- don't have INSERT grant on the versions table. Only fires on actual content
-- changes (title or body), not cosmetic position bumps.
create or replace function public.snapshot_knowledge_doc_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.title is distinct from new.title) or (old.body is distinct from new.body) then
    insert into public.knowledge_doc_versions (doc_id, org_id, title, body, edited_by)
      values (old.id, old.org_id, old.title, old.body, old.updated_by);
  end if;
  return new;
end;
$$;

create trigger knowledge_docs_snapshot_version before update on public.knowledge_docs
  for each row execute function public.snapshot_knowledge_doc_version();

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.knowledge_docs     to anon, authenticated;
grant select                          on public.knowledge_doc_versions to anon, authenticated;
grant select, insert, update, delete on public.knowledge_examples to anon, authenticated;

grant all on public.knowledge_docs           to service_role;
grant all on public.knowledge_doc_versions   to service_role;
grant all on public.knowledge_examples       to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — any org member can read AND edit knowledge per Cosmo's call.
-- (Roles are still tracked, but the gate is membership, not role.)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.knowledge_docs           enable row level security;
alter table public.knowledge_doc_versions   enable row level security;
alter table public.knowledge_examples       enable row level security;

-- knowledge_docs: members read, members write
create policy "knowledge_docs_select_member"
  on public.knowledge_docs for select
  using (org_id in (select public.user_org_ids()));

create policy "knowledge_docs_insert_member"
  on public.knowledge_docs for insert
  with check (org_id in (select public.user_org_ids()));

create policy "knowledge_docs_update_member"
  on public.knowledge_docs for update
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy "knowledge_docs_delete_member"
  on public.knowledge_docs for delete
  using (org_id in (select public.user_org_ids()));

-- knowledge_doc_versions: read-only for members; trigger inserts via row owner perms
create policy "knowledge_doc_versions_select_member"
  on public.knowledge_doc_versions for select
  using (org_id in (select public.user_org_ids()));

-- knowledge_examples: members read, members write
create policy "knowledge_examples_select_member"
  on public.knowledge_examples for select
  using (org_id in (select public.user_org_ids()));

create policy "knowledge_examples_insert_member"
  on public.knowledge_examples for insert
  with check (org_id in (select public.user_org_ids()));

create policy "knowledge_examples_update_member"
  on public.knowledge_examples for update
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy "knowledge_examples_delete_member"
  on public.knowledge_examples for delete
  using (org_id in (select public.user_org_ids()));
