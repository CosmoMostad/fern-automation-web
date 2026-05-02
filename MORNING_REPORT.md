# Morning report — overnight build

Branch: `console-rich-features` (pushed). Built on top of `console-backend` (PR #7).

## What's done

### Schema (need you to run the migrations)

Two new SQL files in `supabase/migrations/`:

- `0002_messages_threads_escalations.sql` — live activity layer
- `0003_knowledge.sql` — knowledge layer with edit history

**ACTION**: open Supabase Studio → SQL Editor, paste each file's contents, hit Run. Order matters (0002 before 0003). Both are idempotent (drop + rebuild) so safe to re-run.

### Hetzner-side library (`~/Projects/fern-agents/shared/`)

Two new modules, ready for the day we wire agents up:

- `console_db.py` — service-role REST client. Helpers to insert messages, threads, escalations, events, agent_runs from agent code.
- `knowledge.py` — pulls org-level + agent-level knowledge docs + few-shot examples and renders a prompt block.

Not used by any agent yet. Will plug in later when we move actual runtime onto Supabase.

These files are uncommitted in the fern-agents repo (your other work there is also uncommitted; I didn't want to bundle).

### Console — every page in your sidebar now exists

Routes built:
- `/console/agents/[id]` — per-agent detail page with **Timeline / Knowledge / Examples / Settings** tabs
- `/console/settings/business` — org-level knowledge editor + business name + team list
- `/console/escalations` — open queue + recently resolved
- `/console/inbox` — cross-agent message stream

Sidebar items are now real Next.js Links, with active-route highlighting based on `usePathname()`.

### Approve / Escalate / Claim / Resolve flows

All wired through server actions:

- **Approve a draft** → flips message status to `approved`. Hetzner cron-poll will (eventually) pick it up and Gmail-send.
- **Escalate a message** → marks it `escalated`, inserts an open `escalations` row.
- **Claim an escalation** → only you can resolve it.
- **Resolve an escalation** → with optional resolution note.

RLS protects every table. Approval/escalation routes through the service-role client *after* an authorization read confirms membership.

### Demo seed (`npm run seed`)

The seed script now produces a fully populated demo org:

- 6 agents (Intake & booking is set to `live`; the others are scoped/in-build)
- 4 org-level knowledge docs (the standard "What we do / Hours / Voice / Signature" four)
- 3 agent-scoped knowledge docs for Intake & booking (booking policy, tier rules, escalation policy)
- 2 few-shot examples for Intake & booking
- 5 threads with 10 realistic messages (mix of sent / drafted / pending_approval / escalated)
- 1 open escalation (member asking about medical pause — outside the agent's scope)
- 5 activity events for the right-sidebar feed

**ACTION**: after running migrations, run:
```
SEED_OWNER_EMAIL=cosmo727@outlook.com npm run seed
```

The `SEED_OWNER_EMAIL` flag adds your auth.users row as a co-owner of the demo org, so signing in with `cosmo727@outlook.com` lands you straight on rich data. (You'll see the warn message if your auth user doesn't exist yet — sign in once via magic link, then re-run the seed.)

You can also sign in as `demo@fernautomation.com` to play the role of "Cooper". The seed creates that auth user with email_confirm=true, so it'll receive magic links normally.

## What's NOT done — be honest about the gaps

- **Agents don't actually run yet.** All this is plumbing. The agents in fern-agents/ haven't been changed; they still load YAML, ignore Supabase, and don't write back. That's the next big build.
- **The Approve button doesn't actually send Gmail.** It flips a status flag. A Hetzner-side cron that polls for `status='approved'` and sends needs to be written. Until then, "approving" is a Console-only ceremony.
- **No knowledge version history viewer in the UI.** The `knowledge_doc_versions` table fills automatically via trigger on every edit; we just don't have the "show diff" UI yet. Click the "History" link on any agent doc and you'll get a placeholder alert.
- **No inbound Gmail polling.** The infra to grab new emails and mirror them into `messages` doesn't exist on Hetzner yet.
- **No team invite UI.** Settings → Business → Team shows the list but you can't add anyone. The current path is "have them sign in via magic link, then SQL-insert into org_members." Crude but functional.
- **No agent run-cadence editor.** Agent settings has name/description/status only. Cron schedule and approval-required toggle are placeholder.
- **The `/console/activity`, `/console/voice`, `/console/reports` routes don't exist** — clicking them in the sidebar 404s. Decide later whether to build them or remove from the nav.

## How to verify everything visually

1. Run the migrations (above)
2. Run the seed (above)
3. Visit the preview URL for the `console-rich-features` branch
4. Sign in
5. Click into "Intake & booking" agent
6. Walk through Timeline → expand the "wedding inquiry" message → Approve & send (will flip status; Gmail send is stubbed)
7. Walk through Knowledge → edit the booking policy → save → reload → confirm the edit shows
8. Walk through Examples → toggle one off → toggle it back on
9. Click Escalations in sidebar → claim the medical-pause escalation → resolve with a note
10. Settings → Business → seed/edit a knowledge doc

## Schema decisions worth a sanity-check

A few choices I made tonight that you may want to reverse:

1. **Threads are populated automatically by trigger** when a message inserts — no explicit "create thread" UI. The seed script creates them upfront, but in production the agent code calls `find_or_create_thread()` from `shared/console_db.py` on first inbound message and the trigger keeps last_message_at fresh.

2. **Edit history snapshots only fire on title or body changes**, not position bumps. If you want every save (even cosmetic) to leave a version row, change the trigger condition in `0003_knowledge.sql`.

3. **Any org_member can edit knowledge** — RLS is gated on membership, not role. If you ever want owner-only edits, change the four `knowledge_docs_*` policies and the `knowledge_examples_*` policies to filter on role.

4. **The Approve button only flips status; the actual Gmail-send is left for the cron-poll script.** I noted this above too. The reason was to avoid building a Hetzner HTTP endpoint tonight — cron-poll is the simpler path you OK'd in your Part 5 explanation.

5. **The seed sets the demo org to `setup_status='live'`** so the Console's "All systems normal" green pill appears. Change the seed to `'in-setup'` if that feels premature.

## Files changed (high level)

```
fernautomation-web/
├── app/console/
│   ├── agents/[id]/                  ← NEW page + actions
│   ├── escalations/                   ← NEW page
│   ├── inbox/                         ← NEW page
│   └── settings/business/             ← NEW page + actions
├── components/console/
│   ├── Shell.tsx                      ← NEW (Sidebar + TopBar + icons)
│   ├── AgentDetailShell.tsx           ← NEW (per-agent page chrome)
│   ├── BusinessSettings.tsx           ← NEW
│   ├── EscalationsView.tsx            ← NEW
│   ├── InboxView.tsx                  ← NEW
│   ├── Dashboard.tsx                  ← edited (agent cards now link)
│   └── agent-tabs/
│       ├── TimelineTab.tsx            ← NEW
│       ├── KnowledgeTab.tsx           ← NEW
│       ├── ExamplesTab.tsx            ← NEW
│       └── AgentSettingsTab.tsx       ← NEW
├── lib/db/
│   ├── agent-detail.ts                ← NEW
│   ├── business-settings.ts           ← NEW
│   ├── escalations.ts                 ← NEW
│   └── inbox.ts                       ← NEW
├── lib/supabase/types.ts              ← edited (new entity types)
├── scripts/seed.ts                    ← edited (rich seed)
└── supabase/migrations/
    ├── 0002_messages_threads_escalations.sql   ← NEW
    └── 0003_knowledge.sql                       ← NEW

fern-agents/
└── shared/
    ├── console_db.py                  ← NEW (uncommitted)
    └── knowledge.py                   ← NEW (uncommitted)
```

## When you're ready

Open PR #7's preview link or push `console-rich-features` to a new PR. Recommend doing the migration + seed *first* before opening, otherwise the preview shows empty rows everywhere.

I'm done. Sleep well — log back in whenever and tell me where to keep going.
