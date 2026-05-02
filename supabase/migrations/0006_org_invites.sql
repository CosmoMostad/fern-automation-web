-- Fern Console — Team invites
-- Idempotent: safe to re-run.
--
-- When an existing org member invites someone by email, we drop a row
-- in org_invites. They get a magic-link/OTP email through Supabase auth.
-- On first sign-in, the dashboard loader claims the invite — inserts an
-- org_members row + marks the invite accepted.

drop table if exists public.org_invites cascade;

create table public.org_invites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  email         text not null check (email = lower(email) and length(email) > 0),
  role          text not null default 'staff' check (role in ('owner', 'admin', 'staff', 'viewer')),
  invited_by    uuid references auth.users(id) on delete set null,
  accepted_at   timestamptz,
  accepted_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (org_id, email)
);

create index org_invites_email_pending_idx
  on public.org_invites(email)
  where accepted_at is null;

create index org_invites_org_idx on public.org_invites(org_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants + RLS
-- ─────────────────────────────────────────────────────────────────────────────

grant select on public.org_invites to anon, authenticated;
grant all    on public.org_invites to service_role;

alter table public.org_invites enable row level security;

-- Members of an org can see pending invites for that org
create policy "org_invites_select_member"
  on public.org_invites for select
  using (org_id in (select public.user_org_ids()));

-- Insert / update / delete only via service_role (server actions),
-- so we don't need a member-write policy here.
