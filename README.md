# Slack LMS (Apps Script + Sheets + Slack + Gemini/Gems)

This repository contains a modular, Apps Script-friendly implementation of a Slack-native LMS with:

- Slack request verification and routing
- Google Sheets-oriented DAL + repositories
- Onboarding, lesson delivery, progress, reminders, queue/scheduler engines
- Gemini + Gem role invocation pipeline (draft generation, QA, publishing)
- Smoke tests for major workflow chains

---

## 1) Prerequisites

Before deployment, ensure you have:

- A Google Workspace account with access to:
  - Google Sheets
  - Google Apps Script
- A Slack workspace where you can create/install apps
- Gemini API access configured for your org/project
- Local Node.js (for smoke tests):
  - Node 18+ recommended

---

## 2) Create the System-of-Record Google Sheet

1. Create a new Google Spreadsheet (name suggestion: `Slack LMS SoR`).
2. Create tabs listed in architecture/docs (or run your bootstrap path from Apps Script using `TAB_SCHEMAS`).
3. Confirm core tabs exist at minimum:
   - `Settings`
   - `Users`, `Tracks`, `Lessons`, `Enrollments`, `Progress`, `Deliveries`, `Reminders`
   - `Queue`, `Audit_Log`, `Error_Log`
   - `Gem_Roles`, `Prompt_Configs`, `Content_Pipeline`, `Generated_Drafts`, `QA_Results`, `Publish_Queue`

> Tip: Protect the `Settings` tab and keep secrets editable only by admins.

---

## 3) Configure Settings/Secrets

Populate `Settings` (or Script Properties mirror) with these required values:

- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `WEBHOOK_MAX_SKEW_SECONDS` (e.g., `300`)
- `APP_ENV` (e.g., `prod`)

Recommended extra operational keys:

- `QUEUE_MAX_ATTEMPTS`
- `QUEUE_BACKOFF_SECONDS`
- `QUEUE_STALE_LOCK_SECONDS`
- `GEMINI_MODEL`
- `GEMINI_TIMEOUT_MS`

---

## 4) Create and Configure Slack App

1. Go to Slack API > Your Apps > Create App.
2. Enable and configure:
   - **Slash Commands**: `/learn`, `/progress`, `/lesson`, `/complete`, `/onboard`, `/admin`, `/cohort`, `/resend`
   - **Interactivity & Shortcuts**
   - **Event Subscriptions** (if used)
3. OAuth scopes (minimum starting point):
   - `commands`
   - `chat:write`
   - `im:read`
   - `im:write`
   - `users:read`
4. Install the app to workspace.
5. Copy:
   - Bot token (`xoxb-...`) -> `SLACK_BOT_TOKEN`
   - Signing secret -> `SLACK_SIGNING_SECRET`

---

## 5) Deploy Google Apps Script Web App

> This repository is Node-style modular code. In Apps Script deployment, bundle/transpile or map module logic into Apps Script files.

1. Open Apps Script (standalone or bound to the SoR sheet).
2. Add project files corresponding to `src/` modules (or your bundled output).
3. Expose a `doPost(e)` entrypoint that delegates to your webhook handler logic.
4. Deploy as **Web app**:
   - Execute as: Me
   - Who has access: Anyone (for Slack webhook ingress)
5. Copy deployed Web App URL.

Use this URL in Slack for:

- Slash command Request URLs
- Interactivity Request URL
- Event subscription Request URL (if enabled)

---

## 6) Seed Core Data

Before first learner traffic:

1. Add at least one active `Track`.
2. Add ordered `Lessons` for the track.
3. Add `Gem_Roles` and `Prompt_Configs` rows for AI pipeline roles.
4. Add at least one admin user in `Users`.

---

## 7) Configure Schedulers/Triggers

In Apps Script, create time-driven triggers for queue and scans:

- Queue worker: every 5 minutes
- Delivery scan: hourly
- Reminder scan: hourly
- Reporting/maintenance: daily (optional)

Each trigger should call your corresponding scheduler/worker entry functions that enqueue/process `Queue` jobs.

---

## 8) Local Validation Before/After Deploy

Run the smoke suites locally:

```bash
npm test
```

This executes:

- foundation checks
- data-layer checks
- learner lifecycle checks
- queue/scheduler checks
- AI pipeline checks

---

## 9) Deployment Verification Checklist

After deploy, verify in order:

1. Slack signature verification succeeds (no auth rejects for valid requests).
2. `/onboard` creates/updates `Users` + `Enrollments`.
3. Delivery scan enqueues jobs in `Queue`.
4. Queue worker claims and processes jobs (`pending` -> `in_progress` -> `done/retry`).
5. `/complete` updates `Progress` and self-paced users receive next lesson.
6. Reminder scan identifies overdue deliveries and sends one reminder per idempotency key.
7. AI pipeline can:
   - start pipeline row
   - generate draft
   - record QA results
   - publish approved content into `Lesson_Content`

---

## 10) Common Failure Modes

- **401 unauthorized from webhook**
  - Check `SLACK_SIGNING_SECRET`, timestamp skew, and raw-body handling.
- **No Slack messages sent**
  - Check `SLACK_BOT_TOKEN` and scopes.
- **Queue jobs stuck in retry**
  - Check handler mapping and error payloads in `Queue`/`Error_Log`.
- **Duplicate deliveries/reminders**
  - Verify idempotency keys are present and stable.
- **AI role invocation failures**
  - Ensure active `Gem_Roles` + matching active `Prompt_Configs` exist.

---

## 11) Production Hardening Notes

- Restrict spreadsheet sharing to LMS ops/admin group.
- Protect secret cells/ranges.
- Archive old `Audit_Log`/`Error_Log`/`Queue` rows periodically.
- Add alerting for:
  - queue depth growth
  - repeated retries
  - publish failures
- Use staged rollout: one pilot cohort + one track first.

---

## 12) Quick Start (Minimal End-to-End)

1. Create Sheet + tabs and fill `Settings`.
2. Create Slack app and wire request URLs to Apps Script web app.
3. Seed one track with 2 lessons.
4. Seed one active learner and one admin.
5. Run `/onboard` for learner.
6. Run delivery scan + queue worker.
7. Complete lesson and verify next lesson flow.
8. Trigger AI pipeline for a draft and publish flow.

If all eight pass, your baseline deployment is functional.
