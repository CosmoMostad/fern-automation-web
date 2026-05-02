-- Fern Console — Agent Marketplace, Students, Reports, Trust Mode
-- Idempotent: safe to re-run. Drops existing tables we own first.
--
-- What this migration adds:
--   1. agent_types          — registry of installable agent types (the marketplace)
--   2. students             — per-org student/player records (for tournament_reports)
--   3. student_reports      — generated reports linked to a student
--   4. agents.trust_mode    — enum column for the human-in-loop trust ladder
--
-- Notes:
--   • agent_types uses anonymous check constraints to avoid name collisions on retry.
--   • No FK between agents and agent_types — the link is a string match between
--     agents.config->>'type' and agent_types.key. Lets agents exist without a type
--     row (legacy demo agents) and lets us swap or rename type rows freely.

drop table if exists public.student_reports cascade;
drop table if exists public.students cascade;
drop table if exists public.agent_types cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- agent_types — installable agent registry
-- ─────────────────────────────────────────────────────────────────────────────

create table public.agent_types (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null check (key ~ '^[a-z][a-z0-9_]+$'),
  name            text not null,
  description     text,
  category        text not null default 'customer_ops' check (category in (
                    'customer_ops',     -- inbox / Q&A / scheduling
                    'lead_generation',  -- outbound prospecting
                    'analytics',        -- reports, dashboards
                    'workflow'          -- internal automations
                  )),
  trigger_kind    text not null default 'cron' check (trigger_kind in (
                    'cron',     -- runs on a schedule
                    'inbound',  -- runs when an external event arrives
                    'on_demand' -- runs when a Console action triggers it
                  )),
  default_config  jsonb not null default '{}',
  icon            text,
  is_published    boolean not null default true,
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index agent_types_published_idx on public.agent_types(is_published, position) where is_published;
create index agent_types_category_idx  on public.agent_types(category, position);

create trigger agent_types_set_updated_at before update on public.agent_types
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- students — per-org student/player records
-- (currently scoped for tournament_reports; reusable for any program)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.students (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,

  full_name       text not null,
  preferred_name  text,
  age             int,
  birthdate       date,
  location        text,                                  -- "Bellevue, WA"
  sport           text,                                  -- 'tennis', 'golf', 'multi'

  -- Lightweight rating snapshot (program-specific richer data lives in metadata)
  current_rating       numeric,
  current_rating_label text,                             -- 'UTR', 'AJGA', etc.

  parent_email    text,
  parent_name     text,

  -- Free-form key/value bag — current_program, eval_status, coach_assigned, etc.
  metadata        jsonb not null default '{}',

  status          text not null default 'active' check (status in (
                    'prospect',   -- inquiry only, not yet enrolled
                    'evaluating', -- in evaluation pipeline
                    'active',     -- currently a customer
                    'alumni',     -- graduated / aged out
                    'inactive'    -- left, archived, etc.
                  )),

  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index students_org_id_idx          on public.students(org_id, full_name);
create index students_org_status_idx      on public.students(org_id, status);
create index students_search_name_idx     on public.students using gin (to_tsvector('english', full_name));
create index students_metadata_idx        on public.students using gin (metadata);

create trigger students_set_updated_at before update on public.students
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- student_reports — generated reports (tournament reports first; extensible)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.student_reports (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references public.orgs(id) on delete cascade,
  agent_id                uuid references public.agents(id) on delete set null,
  student_id              uuid references public.students(id) on delete set null,

  -- Snapshot of the player's name at the time the report was generated.
  -- Useful when the report is for a non-rostered prospect not in students.
  student_name_snapshot   text not null,

  report_type             text not null default 'tournament' check (report_type in (
                            'tournament',
                            'progress',
                            'evaluation',
                            'other'
                          )),
  body_markdown           text not null,
  source_data             jsonb not null default '{}',

  -- For sharing with parents — read-only short-link surface
  share_slug              text unique,

  generated_at            timestamptz not null default now(),
  created_at              timestamptz not null default now()
);

create index student_reports_org_id_idx     on public.student_reports(org_id, generated_at desc);
create index student_reports_student_idx    on public.student_reports(student_id, generated_at desc);
create index student_reports_share_slug_idx on public.student_reports(share_slug) where share_slug is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- agents.trust_mode — human-in-loop trust ladder
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.agents
  add column if not exists trust_mode text not null default 'manual'
    check (trust_mode in ('manual', 'assisted', 'autonomous'));

-- Reference: existing approval flow on `messages` rows still applies.
-- Trust mode interpretation:
--   • manual     → every outbound goes to status='pending_approval' first
--   • assisted   → high-confidence drafts auto-send; low-confidence escalate
--   • autonomous → all drafts auto-send unless an explicit escalate condition fires

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants + RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- agent_types is GLOBAL — every authenticated user can browse the catalog.
grant select on public.agent_types  to anon, authenticated;
grant all    on public.agent_types  to service_role;

grant select, insert, update on public.students        to anon, authenticated;
grant select, insert         on public.student_reports to anon, authenticated;
grant all                    on public.students        to service_role;
grant all                    on public.student_reports to service_role;

alter table public.agent_types       enable row level security;
alter table public.students          enable row level security;
alter table public.student_reports   enable row level security;

-- agent_types: any logged-in user can read the catalog
create policy "agent_types_select_all_authenticated"
  on public.agent_types for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- students: org-member-only read/write
create policy "students_select_member"
  on public.students for select
  using (org_id in (select public.user_org_ids()));

create policy "students_insert_member"
  on public.students for insert
  with check (org_id in (select public.user_org_ids()));

create policy "students_update_member"
  on public.students for update
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

-- student_reports: org-member-only read; writes go through service-role only
-- (the agent runtime creates them).
create policy "student_reports_select_member"
  on public.student_reports for select
  using (org_id in (select public.user_org_ids()));

-- Public read access to a report by share_slug — for sharing with parents.
-- Optional; remove this policy if not desired.
create policy "student_reports_select_by_slug"
  on public.student_reports for select
  using (share_slug is not null);
