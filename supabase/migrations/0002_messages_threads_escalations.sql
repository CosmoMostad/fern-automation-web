-- Fern Console — messages, threads, escalations
-- Idempotent: safe to re-run. Drops existing tables first.
-- Adds the live-activity layer the Console needs to show real agent traffic.

drop table if exists public.escalations cascade;
drop table if exists public.messages cascade;
drop table if exists public.threads cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- threads — conversation grouping (one row per back-and-forth thread)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.threads (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  agent_id        uuid references public.agents(id) on delete set null,
  subject         text,
  contact_email   text,
  contact_name    text,
  status          text not null default 'open' check (status in ('open', 'closed', 'escalated')),
  last_message_at timestamptz not null default now(),
  message_count   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index threads_org_id_idx           on public.threads(org_id, last_message_at desc);
create index threads_org_status_idx       on public.threads(org_id, status);
create index threads_agent_id_idx         on public.threads(agent_id, last_message_at desc);
create index threads_contact_email_idx    on public.threads(org_id, contact_email);

-- ─────────────────────────────────────────────────────────────────────────────
-- messages — every email / sms / voice interaction, both directions
-- ─────────────────────────────────────────────────────────────────────────────

create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  agent_id      uuid references public.agents(id) on delete set null,
  thread_id     uuid references public.threads(id) on delete set null,
  direction     text not null check (direction in ('inbound', 'outbound')),
  channel       text not null default 'email' check (channel in ('email', 'sms', 'voice')),
  status        text not null check (status in (
                  'received', 'drafted', 'pending_approval',
                  'approved', 'sent', 'failed', 'escalated'
                )),
  from_addr     text,
  to_addr       text,
  subject       text,
  body          text,
  body_preview  text,                          -- first ~200 chars for list views
  external_id   text,                          -- gmail msg id, twilio sid, etc
  llm_input     jsonb,                         -- full prompt sent to claude
  llm_output    jsonb,                         -- full claude response
  approved_by   uuid references auth.users(id) on delete set null,
  approved_at   timestamptz,
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

create index messages_org_id_idx       on public.messages(org_id, created_at desc);
create index messages_agent_id_idx     on public.messages(agent_id, created_at desc);
create index messages_thread_id_idx    on public.messages(thread_id, created_at asc);
create index messages_status_idx       on public.messages(org_id, status);
create index messages_external_id_idx  on public.messages(external_id) where external_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- escalations — items bumped to a human, with claim/resolve flow
-- ─────────────────────────────────────────────────────────────────────────────

create table public.escalations (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  agent_id        uuid references public.agents(id) on delete set null,
  message_id      uuid references public.messages(id) on delete set null,
  thread_id       uuid references public.threads(id) on delete set null,
  reason          text not null check (reason in (
                    'low_confidence', 'requested_human', 'angry_tone',
                    'manual_flag', 'policy_block', 'other'
                  )),
  reason_detail   text,
  status          text not null default 'open' check (status in ('open', 'claimed', 'resolved', 'dismissed')),
  claimed_by      uuid references auth.users(id) on delete set null,
  claimed_at      timestamptz,
  resolved_by     uuid references auth.users(id) on delete set null,
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz not null default now()
);

create index escalations_org_id_idx        on public.escalations(org_id, created_at desc);
create index escalations_org_status_idx    on public.escalations(org_id, status);
create index escalations_agent_id_idx      on public.escalations(agent_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers — auto-fill body_preview, keep threads in sync, updated_at
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_message_preview()
returns trigger
language plpgsql
as $$
begin
  if new.body is not null and (new.body_preview is null or new.body_preview = '') then
    new.body_preview := substr(regexp_replace(new.body, E'[\\r\\n\\s]+', ' ', 'g'), 1, 200);
  end if;
  return new;
end;
$$;

create trigger messages_set_preview before insert or update on public.messages
  for each row execute function public.set_message_preview();

create or replace function public.touch_thread_on_message()
returns trigger
language plpgsql
as $$
begin
  if new.thread_id is not null then
    update public.threads
       set last_message_at = new.created_at,
           message_count   = message_count + 1,
           updated_at      = now()
     where id = new.thread_id;
  end if;
  return new;
end;
$$;

create trigger messages_touch_thread after insert on public.messages
  for each row execute function public.touch_thread_on_message();

create trigger threads_set_updated_at before update on public.threads
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────────────

grant select               on public.threads     to anon, authenticated;
grant select               on public.messages    to anon, authenticated;
grant select, update       on public.escalations to anon, authenticated;

grant all on public.threads     to service_role;
grant all on public.messages    to service_role;
grant all on public.escalations to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.threads     enable row level security;
alter table public.messages    enable row level security;
alter table public.escalations enable row level security;

-- threads: any member can read
create policy "threads_select_member"
  on public.threads for select
  using (org_id in (select public.user_org_ids()));

-- messages: any member can read
create policy "messages_select_member"
  on public.messages for select
  using (org_id in (select public.user_org_ids()));

-- escalations: any member can read and update (claim / resolve / dismiss)
create policy "escalations_select_member"
  on public.escalations for select
  using (org_id in (select public.user_org_ids()));

create policy "escalations_update_member"
  on public.escalations for update
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

-- All inserts (and the tricky message status transitions) go through service_role
-- from Hetzner, which bypasses RLS. That's intentional — the runtime is the only
-- thing that should be writing live-activity data.
