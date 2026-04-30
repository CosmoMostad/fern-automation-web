# Supabase setup

This directory holds SQL migrations for the Fern Console database.

## First-time setup

1. Create a Supabase project at https://supabase.com (free tier is fine for now).
2. In the Supabase dashboard, go to **SQL Editor**.
3. Open `migrations/0001_initial_schema.sql` from this repo and paste the entire contents into a new SQL Editor query.
4. Run it. It creates the schema, indexes, triggers, and RLS policies.
5. Copy these three values from **Settings → API** into `.env.local` at the repo root:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` public key
   - `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` secret key (never commit, never expose to client)
6. Run the seed script to populate a Demo Org for development:
   ```
   npm run seed
   ```

## Schema overview

| table | purpose |
|---|---|
| `orgs` | one per business |
| `org_members` | join table between `auth.users` and `orgs`, with role |
| `agents` | one per automated workflow, status: scoped/in-build/live/paused/archived |
| `agent_runs` | each invocation/run of an agent |
| `events` | high-level activity feed (what shows in the console activity rail) |
| `agent_requests` | submissions from the "Request a new agent" modal |
| `threads` | conversation grouping — one per back-and-forth thread with a contact |
| `messages` | every email/sms/voice exchange, both directions, with full body and llm i/o |
| `escalations` | items bumped to a human, with claim/resolve flow |
| `knowledge_docs` | per-org base layer + per-agent fact buckets that get rendered into prompts |
| `knowledge_doc_versions` | append-only edit history, snapshotted by trigger on every doc update |
| `knowledge_examples` | few-shot email examples (always agent-scoped, toggleable active flag) |

All tenant tables have RLS enabled. A helper function `public.user_org_ids()` returns the set of orgs the current user belongs to. Policies join against that set so users only see their org's data.

The `service_role` key bypasses RLS and is what the agent runtime (on Hetzner) uses to insert events and agent_runs. **Never expose service_role to the browser.**

## Adding new migrations

Drop a new numbered file in `migrations/`, e.g. `0004_something.sql`. Run it manually in the Supabase SQL Editor. (We can wire up the Supabase CLI later if we want automated migrations.)

## Apply pending migrations

In order, paste each into Supabase Studio → SQL Editor → Run:

1. `migrations/0001_initial_schema.sql` — orgs, members, agents, runs, events, requests
2. `migrations/0002_messages_threads_escalations.sql` — live activity layer
3. `migrations/0003_knowledge.sql` — knowledge docs, versions, few-shot examples

All three are idempotent — re-running them drops and rebuilds their tables. Do NOT run 0002 and 0003 against a database with real production data without first backing up: they `drop table cascade` to keep iteration painless.
