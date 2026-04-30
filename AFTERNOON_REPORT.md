# Afternoon report — the wire is built

Picking up from `MORNING_REPORT.md`. Today's session connected Hetzner to Supabase to the Console for the first time.

## What's new (vs this morning)

### In `fernautomation-web` (this repo, branch `console-rich-features`, PR #8)

- **Seed update**: `scripts/seed.ts` now sets `agents.config.type` on every demo agent. This is the field the Hetzner runtime joins on to resolve its own `agent_id` at startup. Without it, agents can't connect.
- **Demo agent list refined**: replaced "Member outreach" and "Internal staff Slack" placeholders with the two real agents we have code for (Competitor watch, Corporate event hunter), so the demo org actually has runnable agents. "Competitor watch" is marked `live` — running it on Hetzner will produce real activity in the Console.

### In `fern-agents` (sibling repo at `~/Projects/fern-agents/`, NOT YET COMMITTED — see "Repo hygiene" below)

The runtime that turns the Console from a beautiful frontend into a functioning system. Eight new or rewritten files:

| File | Purpose |
|---|---|
| `shared/agent.py` | The `@fern_agent` context manager. The single import every new agent uses. Hides run-lifecycle, knowledge-loading, event-recording, and message-drafting boilerplate. ~270 lines but they replace 30+ lines of boilerplate that would otherwise live in every agent. |
| `shared/console_db.py` | Service-role REST client for Supabase. Added `get_org_by_slug`, `get_org`, and `lookup_agent` so agents can resolve their UUIDs from the human-readable client slug + agent type. |
| `shared/knowledge.py` | Already existed from last night — pulls org base + agent docs + active examples and renders a system-prompt block. |
| `agents/competitor_watch/agent.py` | **Rewritten** to use `@fern_agent`. Now writes runs/events/drafts to Supabase. Drops the direct Gmail-draft creation in favor of `messages` rows that the Console can show + approve. |
| `agents/corporate_event_hunter/agent.py` | **Rewritten** to use `@fern_agent`. Same pattern. Approval-required defaults to true (cold outreach). |
| `agents/_runner/onboard.py` | The CLI you'll use to add a fake business. Idempotent: creates org, agent rows, `clients/<slug>/` folder, attempts to attach owner if their auth.users row exists. |
| `agents/_runner/send_approved.py` | The cron-poll daemon. Runs forever, polls Supabase every 30s for `messages.status='approved'`, sends them via Gmail using the right client's token, marks `'sent'`. SIGTERM-aware, idempotent re-read before send to prevent double-sends. |
| `agents/_runner/_config_template.yaml` | Starter `config.yaml` template the onboarding CLI substitutes into per new client. |
| `agents/_runner/send_approved.service` | systemd unit file for running the daemon as a service on Hetzner. |

## How an agent's life looks now

```
                                                         Console (Vercel)
                                                                ▲
                                                                │  reads via RLS
                              ┌─────────────────────────────────┘
                              │
                              ▼
                       Supabase (Postgres)
                              ▲
                              │  writes via service-role REST
                              │
   ┌──────────────────────────┴───────────────────────────┐
   │                                                      │
Cron fires:                                       Daemon runs forever:
  python -m agents.competitor_watch \              python -m agents._runner.send_approved
        --client wsc                               (or as a systemd service)
   │                                                      │
   ▼                                                      ▼
fern_agent context manager:                        Polls every 30s:
  • lookup_agent("wsc", "competitor_watch")         "any messages.status='approved'?"
  • start agent_run                                 ├─ yes → load client token,
  • run the agent's logic                           │       send via Gmail,
  • events into events table                        │       mark 'sent'
  • drafts into messages w/ status                  └─ no  → sleep
    = 'pending_approval' or 'approved'
  • finish agent_run
```

## To activate everything when you're back

This is the sequence that takes us from "code exists" to "demo is alive."

### Step 1 — Run the schema migrations (one-time)

You're going to paste two SQL files into Supabase Studio. Both are idempotent (safe to re-run; they drop and rebuild their tables).

1. Open https://supabase.com/dashboard → `Cosmo's Org` project → **SQL Editor** in the left sidebar
2. Click **+ New query**
3. Open `supabase/migrations/0002_messages_threads_escalations.sql` from this repo, copy entire contents, paste into the SQL Editor, click **Run**. Wait for green "Success."
4. Same for `supabase/migrations/0003_knowledge.sql`. Run.

You'll know it worked if you can run this in a fresh SQL Editor tab and get rows back:
```sql
select tablename from pg_tables
where schemaname = 'public'
order by tablename;
```
You should see: `agent_requests, agent_runs, agents, escalations, events, knowledge_doc_versions, knowledge_docs, knowledge_examples, messages, org_members, orgs, threads`.

### Step 2 — Run the seed (one-time)

In a new terminal:

```
cd ~/Projects/fernautomation-web
SEED_OWNER_EMAIL=cosmo727@outlook.com npm run seed
```

Expected output ends with:
```
Done.
---
Demo org slug: demo-sports-club
Sign in as: demo@fernautomation.com
Or sign in as: cosmo727@outlook.com (also an owner)
```

If you see "extra owner: cosmo727@outlook.com not found in auth.users — skip adding as owner. They need to log in via magic link first, then re-run." — that means you haven't actually logged in to the Console yet. Do step 3 first, then come back and re-run this command.

### Step 3 — Sign in to the Console

PR #8 preview URL:
**https://fern-automation-web-git-console-ri-cosmomostads-projects.vercel.app/console**

Sign in with `cosmo727@outlook.com`. Click the magic link. Land in the Console.

If you didn't see your email match in step 2, re-run the seed now. Refresh the Console page. You should see "Demo Sports Club" populated with 6 agents, 4 org-knowledge docs, 3 agent-knowledge docs, 2 examples, 5 threads with 10 messages, 1 open escalation.

### Step 4 — Walk through the Console with rich data

Now you're seeing what a customer would see. Click around:
- Click "Competitor watch" → 4 tabs: Timeline, Knowledge, Examples, Settings
- Click "Intake & booking" → expand the wedding-inquiry pending-approval message → click Approve & send (status flips to `approved`; cron-poll on Hetzner would pick this up next time)
- Knowledge tab → edit a doc → confirm it persists
- /console/escalations → claim and resolve the medical-pause escalation
- /console/inbox → filter by direction, by agent
- /console/settings/business → edit business name

If anything feels wrong, tell me — we patch the UI before agents start writing real data against this schema.

### Step 5 — Wire the Hetzner side

This needs you on Hetzner. Two parts:

**5a. Get the runtime libraries onto Hetzner**

The new files live in `~/Projects/fern-agents/` on your Mac (uncommitted — see "Repo hygiene" below). Push them to Hetzner however you normally do (rsync, scp, or commit + git pull). Specifically you need:

- `shared/agent.py`
- `shared/console_db.py`
- `shared/knowledge.py`
- `agents/competitor_watch/agent.py` (modified)
- `agents/corporate_event_hunter/agent.py` (modified)
- `agents/_runner/` (entire new folder)

**5b. Test the wire end-to-end**

```
ssh main
cd /root/agents
source venv/bin/activate

# First — verify the lookup works (this needs the seed already loaded):
python -c "
from shared.console_db import ConsoleDB
db = ConsoleDB()
org_id, agent_id = db.lookup_agent('demo-sports-club', 'competitor_watch')
print(f'org_id = {org_id}')
print(f'agent_id = {agent_id}')
"
```

If that prints two UUIDs, the wire works. If it prints "No org with slug=demo-sports-club" → you haven't run the seed yet (step 2). If it prints "No agent of type competitor_watch in org demo-sports-club" → the seed ran against an older schema; re-run.

**5c. Run a real agent against the demo org (will burn ~$0.50 of Anthropic)**

You need to first add a watchlist to `clients/demo-sports-club/config.yaml`. The onboarding CLI didn't run for this org since the seed handled it; you'll need to either:

- Create the folder manually: `mkdir clients/demo-sports-club && cp clients/wsc/config.yaml clients/demo-sports-club/config.yaml`, then edit (set client_slug: demo-sports-club, set client_name: "Demo Sports Club", keep the existing watchlist as-is)
- OR run the onboarding CLI (it'll skip Supabase steps since the org already exists, but will create the disk folder + starter config):
  ```
  python -m agents._runner.onboard \
      --slug demo-sports-club \
      --name "Demo Sports Club" \
      --owner-email demo@fernautomation.com \
      --gmail-account demo@fernautomation.com \
      --agents competitor_watch,corporate_event_hunter
  ```

Then run the agent:
```
python -m agents.competitor_watch.agent --client demo-sports-club --dry-run
```

`--dry-run` skips Supabase writes — sanity check. Output should show fetch progress and a synthesized digest at the end.

For the real test:
```
python -m agents.competitor_watch.agent --client demo-sports-club
```

This will:
1. Look up org_id and agent_id from Supabase
2. Open an agent_run row
3. Fetch each competitor in the watchlist with Claude
4. Write events for each
5. Save the digest as a `messages` row with status='approved' (since competitor_watch defaults to no-approval-required)
6. Close the agent_run

**Refresh the Console — you should see the Competitor watch agent's Timeline now contains a real digest message with body. The right rail "Live activity" should show the events.**

### Step 6 — Start the cron-poll daemon

So that approved messages actually get sent via Gmail:

```
ssh main
cd /root/agents
python -m agents._runner.send_approved  # runs forever in foreground, Ctrl-C to stop
```

For prod, install it as a systemd service:
```
sudo cp agents/_runner/send_approved.service /etc/systemd/system/fern-send-approved.service
sudo systemctl daemon-reload
sudo systemctl enable --now fern-send-approved
sudo systemctl status fern-send-approved   # verify "active (running)"
sudo journalctl -u fern-send-approved -f    # tail logs
```

Once the daemon is running, the Approve button in the Console actually sends emails within 30 seconds.

## What's still stubbed

Same gaps as morning, plus:

- **No inbound Gmail polling** — agents can't react to incoming emails yet. Next session.
- **No Gmail OAuth scaffold script** — provisioning a new client's Gmail token is still manual. Should write `python -m agents._runner.gmail_oauth --slug fakebiz` next.
- **No edit-before-approve UI** — Console can only approve as-is. If a user wants to tweak the body, they'd have to edit the body via SQL or wait for that UI.
- **No knowledge version-history viewer** — versions captured, no UI.
- **/console/activity, /voice, /reports** — sidebar links still 404.

## Repo hygiene — important

`~/Projects/fern-agents/` has lots of work that has never been committed to git. Today's files I added are also uncommitted. I deliberately did NOT commit anything in that repo because:

1. Mixing my new files with your other in-progress work into one big "first commit" felt wrong without your approval.
2. Committing only my files would leave a broken tree (the new agent.py imports from `shared/llm.py` etc. which would also need to be in the commit).

What to do: when you're ready, run the following in `~/Projects/fern-agents/`:

```
git add -A           # stages everything currently untracked
git status           # eyeball what's about to be committed
git commit -m "Big bulk commit: shared library, two real agents, _runner package"
git push
```

This gets all our work into source control. After that, future commits stay clean and small.

## Practice loop — your goal

Once everything above works, the actual milestone is doing this end-to-end with a fake business. From a clean state:

```
# 1. Cosmo creates a fresh Gmail account: founderfakebiz@gmail.com
# 2. Provision the org:
ssh main
python -m agents._runner.onboard \
    --slug fakebiz \
    --name "FakeBiz Inc." \
    --owner-email founderfakebiz@gmail.com \
    --gmail-account founderfakebiz@gmail.com \
    --agents competitor_watch

# 3. Founder signs into Console with founderfakebiz@gmail.com → magic link
# 4. Re-run the onboard command → "owner: attached founderfakebiz@gmail.com as owner"
# 5. Run Gmail OAuth (manual for now — see gap above)
# 6. Edit clients/fakebiz/config.yaml → fill in 5 competitors, set enabled: true
# 7. Run: python -m agents.competitor_watch.agent --client fakebiz
# 8. Founder logs in → sees real digest in Console
# 9. Founder clicks Approve → cron-poll sends to founderfakebiz@gmail.com
# 10. Founder checks gmail → digest arrived
```

When you can do that loop in under 10 minutes without hitting any unexpected friction, onboarding is "trivial" and we're ready for real customers.

## Tasks I tracked (and their state)

All 12 phases this session: ✓ done.
- Phase A: schema migrations 0002 + 0003 (last night, awaiting your run in Supabase Studio)
- Phase B: Hetzner-side console_db + knowledge helpers (last night, expanded today)
- Phase C: Console per-agent detail page (last night)
- Phase D: settings/business + escalations + inbox (last night)
- Phase E: rich seed + morning report (last night)
- Phase F: @fern_agent context manager + ConsoleDB lookups (today)
- Phase G: seed populated agents.config.type (today)
- Phase H: competitor_watch + corporate_event_hunter wired (today)
- Phase I: send_approved cron-poll (today)
- Phase J: onboarding CLI (today)
- Phase K: smoke tests passed (today)
- Phase L: this report (today)

That's it. Drive home safe and tell me where to keep going.
