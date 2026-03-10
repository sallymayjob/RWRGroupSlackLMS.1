# Deployment Guide (ELI5: zero technical background)

Hi 👋 This is a **from-GitHub, click-by-click** guide.

You are setting up a Slack learning bot.
Think of it like this:

- **Slack app** = the chatbot face people talk to
- **Google Sheet** = memory notebook
- **Apps Script project** = robot brain
- **This GitHub repo** = robot body parts (code files)

---

## 0) What you need before starting

- A Google account
- A Slack workspace where you can create apps
- Access to this GitHub repository
- About 45–90 minutes

---

## 1) Download/copy the repo from GitHub

If you are non-technical, easiest path:

1. Open the repo on GitHub.
2. Click **Code** → **Download ZIP**.
3. Unzip it on your computer.
4. Open the folder.

If you (or a helper) uses terminal, they can run:

```bash
git clone <repo-url>
```

---

## 2) Create your Google Sheet (memory)

1. Open Google Sheets.
2. Create a blank spreadsheet.
3. Name it: `Slack LMS SoR` (or any name you want).
4. Add these tabs (bottom of sheet, `+` button):
   - `Settings`
   - `Users`, `Tracks`, `Lessons`, `Enrollments`, `Progress`
   - `Deliveries`, `Reminders`, `Queue`
   - `Audit_Log`, `Error_Log`
   - `Gem_Roles`, `Prompt_Configs`, `Content_Pipeline`, `Generated_Drafts`, `QA_Results`, `Publish_Queue`

---

## 3) Fill basic settings in `Settings` tab

Add rows for:

- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `WEBHOOK_MAX_SKEW_SECONDS` = `300`
- `APP_ENV` = `prod`

You will fill token/secret values after Slack app creation.

---

## 4) Create Slack app using `manifest.json`

1. Go to <https://api.slack.com/apps>
2. Click **Create New App**.
3. Choose **From an app manifest**.
4. Open this repo file: `manifest.json`.
5. Copy-paste all JSON into Slack manifest editor.
6. Click create.

Then install:

1. Open **OAuth & Permissions**.
2. Click **Install to Workspace**.
3. Copy **Bot User OAuth Token** (`xoxb-...`).
4. Open **Basic Information** and copy **Signing Secret**.
5. Paste both into your `Settings` sheet.

---

## 5) Understand which files matter for deployment (ELI5 file map)

You do **not** need to deploy docs/tests to Apps Script. Deploy code from `src/`.

### Files you upload/use in Apps Script (core runtime)

- `src/index.js` — main export hub that wires modules together.
- `src/web/doPost.js` — HTTP entrypoint Slack calls.
- `src/web/requestVerifier.js` — security check for Slack signatures.
- `src/web/router.js` — sends each Slack request to the right handler.
- `src/slack/commandHandlers.js` — logic for slash commands like `/learn`.
- `src/slack/slackClient.js` — sends messages back to Slack API.
- `src/services/configService.js` — reads config/secrets.
- `src/services/notificationService.js` — builds/sends notification messages.
- `src/services/idempotencyService.js` — avoids duplicate processing.
- `src/data/dal.js` — data access layer for sheets.
- `src/data/inMemorySheetAdapter.js` — test adapter (usually not needed in production Apps Script).
- `src/data/schema/tabs.js` — tab names/schema constants.
- `src/data/schema/validators.js` — row validation rules.
- `src/data/repositories/usersRepo.js` — user data operations.
- `src/data/repositories/curriculumRepo.js` — tracks/lessons operations.
- `src/data/repositories/learningOpsRepo.js` — learner lifecycle/progress operations.
- `src/data/repositories/adminOpsRepo.js` — admin actions and controls.
- `src/data/repositories/contentPipelineRepo.js` — AI pipeline records.
- `src/data/repositories/aiConfigRepo.js` — AI role/prompt configs.
- `src/data/repositories/index.js` — repository exports.
- `src/engines/onboardingEngine.js` — enrollment/onboarding workflow.
- `src/engines/lessonDeliveryEngine.js` — lesson sending logic.
- `src/engines/progressEngine.js` — completion/progress updates.
- `src/engines/reminderEngine.js` — reminder creation/sending.
- `src/engines/deliveryScanEngine.js` — periodic delivery scanner.
- `src/engines/reminderScanEngine.js` — periodic reminder scanner.
- `src/engines/queueProcessor.js` — queue worker logic.
- `src/engines/schedulerEngine.js` — scheduler coordination.
- `src/engines/contentPipelineEngine.js` — content generation pipeline orchestration.
- `src/engines/contentQAEngine.js` — quality checks for generated content.
- `src/engines/publishingSyncEngine.js` — publish approved content to lessons.
- `src/ai/geminiService.js` — Gemini API integration.
- `src/ai/gemInvocationLayer.js` — role-based AI invocation layer.
- `src/utils/crypto.js` — hashing/signature utilities.

### Files mostly for local development/docs (not uploaded to Apps Script)

- `README.md` — project overview.
- `deployment.md` — this setup guide.
- `docs/*.md` — architecture + implementation details.
- `tests/*.test.js`, `tests/run-all.js` — local smoke tests.
- `package.json` — local Node scripts/dependencies.

---

## 6) Put code into Apps Script (2 options)

### Option A (recommended): ask a developer/helper to bundle modules

Why: Apps Script does best with bundled code.

1. Ask helper to bundle `src/` into Apps Script-compatible output.
2. In Apps Script project, create files and paste bundled output.
3. Ensure there is a global `doPost(e)` function connected to webhook flow.

### Option B (manual copy, if no bundler)

1. Open <https://script.google.com> and create new project.
2. Create script files matching the key modules above.
3. Paste code from repo files into matching Apps Script files.
4. Ensure imports/exports are adjusted for Apps Script format.
5. Keep `doPost(e)` available as the public entrypoint.

If this step feels hard, that is normal—this repo is modular JS and usually needs a technical helper for final Apps Script packaging.

---

## 7) Deploy Apps Script as Web App

1. In Apps Script, click **Deploy** → **New deployment**.
2. Type: **Web app**.
3. **Execute as**: Me.
4. **Who has access**: Anyone.
5. Click Deploy.
6. Copy the Web App URL.

---

## 8) Connect Web App URL back to Slack

Use the same Apps Script URL for:

- Slash command request URLs
- Interactivity request URL
- Event subscription request URL

If you use `manifest.json`, replace `https://YOUR_APPS_SCRIPT_WEB_APP_URL` with your real URL and re-import/update manifest.

---

## 9) Seed minimum data so commands have something to show

Add at least:

- 1 track (example: `TRK-onboarding-101`)
- 2 lessons (`LES-001`, `LES-002`)
- 1 learner user
- 1 admin user

Without this, bot commands can run but return empty results.

---

## 10) Create Apps Script triggers (automation)

In Apps Script → **Triggers**:

- Queue worker: every 5 minutes
- Delivery scan: every hour
- Reminder scan: every hour

This powers automatic lesson sending + reminders.

---

## 11) First test in Slack

Run:

1. `/onboard`
2. `/learn`
3. `/complete`
4. `/progress`

Expected:

- user enrolls
- lesson appears
- completion updates progress
- next lesson becomes available

---

## 12) Fast troubleshooting

- **Command failed** → check deployed Web App URL.
- **Signature error** → check `SLACK_SIGNING_SECRET`.
- **Bot silent** → check `SLACK_BOT_TOKEN` and app install status.
- **No lessons** → check Tracks/Lessons/Enrollments rows.
- **Queue stuck** → check `Queue` tab and trigger schedule.
- **AI output missing** → verify `Gem_Roles` and `Prompt_Configs` rows.

---

## 13) Launch checklist

- ✅ Slack commands respond
- ✅ onboarding works
- ✅ lessons deliver
- ✅ completions update progress
- ✅ reminders send once
- ✅ queue drains normally
- ✅ admin recovery works
- ✅ AI draft → QA → publish works

---

## One-line summary

Copy code from GitHub, connect Slack + Sheet + Apps Script, add secrets, deploy web app, and test commands. Then your LMS bot is live. 🚀
