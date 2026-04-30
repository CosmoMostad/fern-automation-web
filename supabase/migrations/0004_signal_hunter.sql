-- Fern Console — Signal Hunter prospect pipeline
-- Idempotent: safe to re-run. Drops existing tables first.
-- Prospects discovered by Signal Hunter live here BEFORE they become messages.
-- Once approved + sent, they remain linked via prospect_outreach.message_id.

drop table if exists public.prospect_outreach cascade;
drop table if exists public.prospects cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- prospects — every person Signal Hunter has identified, scored, and queued
-- ─────────────────────────────────────────────────────────────────────────────

create table public.prospects (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  agent_id        uuid references public.agents(id) on delete set null,

  -- Identity
  full_name       text not null,
  age             int,
  age_band        text,                              -- e.g. '9-15', '20-30'
  location        text,                              -- city, region, zip area

  -- Signal that triggered this prospect (ALL public-source, no PII beyond name)
  signal_type     text not null,                     -- e.g. 'tournament_finish', 'utr_trajectory'
  signal_summary  text not null,                     -- one-sentence human-readable summary
  signal_detail   jsonb not null default '{}',       -- structured fields (score, dates, urls, etc.)
  source_name     text not null,                     -- e.g. 'USTA TennisLink', 'UTR'
  source_url      text,                              -- the page where signal was discovered

  -- ICP fit
  icp_score       int check (icp_score between 0 and 10),
  icp_reasoning   text,                              -- Claude's one-paragraph "why this fit"

  -- Contact resolution
  contact_email           text,
  contact_name            text,                      -- often a parent / guardian / decision-maker
  contact_relation        text,                      -- 'parent', 'self', 'manager'
  contact_confidence      int check (contact_confidence between 0 and 100),
  contact_resolution_log  jsonb default '[]',        -- audit of which sources were tried

  -- Pipeline state
  status          text not null default 'discovered' check (status in (
                    'discovered',          -- raw signal extracted, ICP not yet scored
                    'scored',              -- ICP score assigned, below threshold or awaiting contact
                    'qualified',           -- score >= threshold, ready for contact lookup
                    'enriched',            -- contact found, ready for drafting
                    'drafted',             -- outreach drafted, queued for human approval
                    'sent',                -- outreach approved + sent
                    'replied',             -- prospect responded
                    'converted',           -- attributed to enrollment / booking / closed-won
                    'passed',              -- skipped by human reviewer
                    'unreachable',         -- contact resolution failed
                    'unsubscribed'         -- said no, never contact again
                  )),

  -- De-dup key — Signal Hunter avoids contacting the same person twice
  -- Format: lowercase(full_name) + '|' + lowercase(location)
  dedup_key       text generated always as (
                    lower(coalesce(full_name, '')) || '|' || lower(coalesce(location, ''))
                  ) stored,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index prospects_org_id_idx        on public.prospects(org_id, created_at desc);
create index prospects_agent_id_idx      on public.prospects(agent_id, created_at desc);
create index prospects_status_idx        on public.prospects(org_id, status);
create index prospects_dedup_idx         on public.prospects(org_id, dedup_key);
create index prospects_score_idx         on public.prospects(org_id, icp_score desc) where icp_score is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- prospect_outreach — every contact attempt for attribution tracking
-- One prospect can have multiple outreach attempts over time; this is the log.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.prospect_outreach (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  prospect_id     uuid not null references public.prospects(id) on delete cascade,
  agent_id        uuid references public.agents(id) on delete set null,
  message_id      uuid references public.messages(id) on delete set null,

  attempt_number  int not null default 1,            -- 1st, 2nd, 3rd contact
  channel         text not null default 'email' check (channel in ('email', 'sms', 'voice')),
  outcome         text not null default 'pending' check (outcome in (
                    'pending', 'sent', 'replied', 'bounced', 'unsubscribed', 'no_response'
                  )),
  attributed_revenue_cents bigint,                   -- if converted, attributed dollars in cents
  attribution_note text,                             -- what the conversion was (e.g. "Enrolled in T1 6/2026")

  sent_at         timestamptz,
  replied_at      timestamptz,
  converted_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index prospect_outreach_org_id_idx     on public.prospect_outreach(org_id, created_at desc);
create index prospect_outreach_prospect_idx   on public.prospect_outreach(prospect_id, attempt_number);
create index prospect_outreach_message_idx    on public.prospect_outreach(message_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────

create trigger prospects_set_updated_at before update on public.prospects
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────────────

grant select, update on public.prospects         to anon, authenticated;
grant select         on public.prospect_outreach to anon, authenticated;

grant all on public.prospects         to service_role;
grant all on public.prospect_outreach to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — members can read their org's prospects, can update status (e.g. Pass).
-- Hetzner-side agent runtime writes via service-role and bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.prospects         enable row level security;
alter table public.prospect_outreach enable row level security;

create policy "prospects_select_member"
  on public.prospects for select
  using (org_id in (select public.user_org_ids()));

create policy "prospects_update_member"
  on public.prospects for update
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy "prospect_outreach_select_member"
  on public.prospect_outreach for select
  using (org_id in (select public.user_org_ids()));
