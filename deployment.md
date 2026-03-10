# Deployment Guide (Explain Like I'm 15)

Hi 👋 — this guide is for someone with **zero technical background**.

You are going to set up a Slack learning bot (LMS) that sends lessons, reminders, and tracks progress.

Think of it like this:

- **Slack** = where people chat with the bot
- **Google Sheets** = the bot’s memory
- **Google Apps Script** = the bot’s brain
- **Gemini/Gems** = helper AI writers/reviewers

We’ll go step-by-step.

---

## Big picture (super simple)

You need to connect 4 things:

1. A Google Sheet (stores data)
2. An Apps Script Web App (runs the code)
3. A Slack App (chat interface)
4. API keys/secrets (passwords that connect everything)

If one is missing, it won’t work.

---

## What you need before starting

- A Google account (with Sheets + Apps Script)
- A Slack workspace where you can create apps
- 30–60 minutes of setup time
- This repo files (already included)

---

## Step 1) Make a Google Sheet (the memory)

1. Go to Google Sheets.
2. Create a new sheet.
3. Name it something like: `Slack LMS SoR`.

This sheet will hold learners, lessons, progress, reminders, queue jobs, etc.

---

## Step 2) Add tabs to your sheet

Create these tabs (each tab is like a table):

- Settings
- Users
- Tracks
- Lessons
- Enrollments
- Progress
- Deliveries
- Reminders
- Queue
- Audit_Log
- Error_Log
- Gem_Roles
- Prompt_Configs
- Content_Pipeline
- Generated_Drafts
- QA_Results
- Publish_Queue

Don’t worry about perfect data yet. We just need the structure first.

---

## Step 3) Fill the `Settings` tab (the passwords/config)

In `Settings`, add these key values:

- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `WEBHOOK_MAX_SKEW_SECONDS` (use `300`)
- `APP_ENV` (use `prod`)

Later, when Slack app is created, you’ll paste real token/secret values.

---

## Step 4) Create your Slack app

1. Go to: [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App**.
3. Choose **From an app manifest**.
4. Copy the content of `manifest.json` from this project.
5. Paste it into Slack.
6. Create the app.

Nice! You now have a Slack app with commands like `/learn`, `/onboard`, `/complete`, etc.

---

## Step 5) Install Slack app to workspace

Inside your Slack app settings:

1. Go to **OAuth & Permissions**.
2. Click **Install App to Workspace**.
3. Approve permissions.
4. Copy the **Bot User OAuth Token** (starts with `xoxb-...`).
5. Go to **Basic Information** and copy **Signing Secret**.

Paste those into your Google Sheet `Settings` tab:

- `SLACK_BOT_TOKEN` = xoxb value
- `SLACK_SIGNING_SECRET` = signing secret value

---

## Step 6) Set up Google Apps Script (the brain)

1. Open [https://script.google.com](https://script.google.com)
2. Create a new project.
3. Add your code (or bundled output) from this repo.
4. Make sure webhook logic is connected to `doPost(e)`.

If you’re working with a developer, ask them to paste/bundle the `src/` modules into Apps Script format.

---

## Step 7) Deploy Apps Script as Web App

In Apps Script:

1. Click **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click Deploy
6. Copy the Web App URL

This URL is where Slack will send events/commands.

---

## Step 8) Put Web App URL into Slack

In Slack app settings, set this same URL for:

- Slash commands request URL
- Interactivity request URL
- Event subscription request URL

If you imported `manifest.json`, replace placeholder URL (`https://YOUR_APPS_SCRIPT_WEB_APP_URL`) with your real Apps Script URL and reapply/update.

---

## Step 9) Add sample learning data

In your sheet add at least:

- 1 track (example: `TRK-onboarding-101`)
- 2 lessons in order (`LES-001`, `LES-002`)
- 1 learner user
- 1 admin user

Without sample data, commands may run but have nothing to show.

---

## Step 10) Turn on scheduler triggers

In Apps Script triggers:

- Queue worker: every 5 minutes
- Delivery scan: every hour
- Reminder scan: every hour

This is what keeps lessons and reminders flowing automatically.

---

## Step 11) Test in Slack

Try this order:

1. `/onboard`
2. `/learn`
3. `/complete`
4. `/progress`

Expected result:

- Learner gets enrolled
- Lesson gets delivered
- Completion updates progress
- Next lesson appears (for self-paced)

---

## Step 12) If something breaks (quick fixes)

### Problem: Slack says command failed
- Check Apps Script web app URL is correct.
- Confirm app deployed as Web App and still active.

### Problem: Unauthorized / signature errors
- Re-check `SLACK_SIGNING_SECRET` in `Settings`.

### Problem: No messages from bot
- Re-check `SLACK_BOT_TOKEN`.
- Make sure Slack app is installed to workspace.

### Problem: No lesson delivery
- Verify track + lessons + enrollment rows exist.
- Check `Queue` tab for stuck jobs.

### Problem: AI pipeline not generating
- Check `Gem_Roles` + `Prompt_Configs` have active rows.

---

## Step 13) Real-world launch checklist

Before going live:

- ✅ Commands work in Slack
- ✅ Users can onboard
- ✅ Lessons are delivered
- ✅ Progress updates on complete
- ✅ Reminders send once (not duplicate)
- ✅ Queue jobs process and don’t pile up
- ✅ Admin can recover failed jobs
- ✅ AI draft → QA → publish flow works

---

## One-line summary

If you connect **Sheet (memory)** + **Apps Script (brain)** + **Slack app (chat)** + **secrets (keys)**, your LMS will work.

You got this 🚀
