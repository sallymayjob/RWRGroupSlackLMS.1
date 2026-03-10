# Slack LMS Setup Guide (Zero Technical Background)

If you can use Google Docs and click around Slack settings, you can set this up.

This guide is written for non-technical people.

---

## What this project does (in plain English)

This project gives you a Slack learning bot.

- People type commands in Slack (like `/learn`)
- The bot stores data in Google Sheets
- Google Apps Script runs the automation behind the scenes

Think of it like:

- **Slack app** = the chat face
- **Google Sheet** = the memory
- **Apps Script** = the brain

---

## Before you start

You need:

1. A Google account
2. A Slack workspace where you can create apps
3. About 60 minutes
4. This repository downloaded to your computer

---

## Step 1) Download this repository

1. Open this repo on GitHub.
2. Click **Code**.
3. Click **Download ZIP**.
4. Unzip the folder.

You will use files from the `appscript/` folder later.

---

## Step 2) Create your Google Sheet (this is your database)

1. Open Google Sheets.
2. Create a blank spreadsheet.
3. Name it something like: **Slack LMS SoR**.
4. Create these tabs at the bottom (click `+`):

- `Settings`
- `Users`
- `Tracks`
- `Lessons`
- `Enrollments`
- `Progress`
- `Deliveries`
- `Reminders`
- `Queue`
- `Audit_Log`
- `Error_Log`
- `Gem_Roles`
- `Prompt_Configs`
- `Content_Pipeline`
- `Generated_Drafts`
- `QA_Results`
- `Publish_Queue`

---

## Step 3) Create your Apps Script project

1. Go to <https://script.google.com>.
2. Click **New project**.
3. Rename it to something like **Slack LMS Bot**.
4. In the file list, delete the default sample code.

Now copy files from your downloaded repo:

1. Open the local `appscript/` folder.
2. For each `.gs` file in that folder, create a matching file in Apps Script and paste the contents.
3. Also ensure `Code.gs` exists in Apps Script (this file is the web entrypoint).

> Tip: You can paste one file at a time; no coding changes needed.

---

## Step 4) Create Slack app from `manifest.json`

1. Go to <https://api.slack.com/apps>
2. Click **Create New App**.
3. Choose **From an app manifest**.
4. Open this repo’s `manifest.json` file.
5. Copy everything and paste into Slack’s manifest editor.
6. Click create.

Then install the app:

1. Go to **OAuth & Permissions**.
2. Click **Install to Workspace**.
3. Copy the **Bot User OAuth Token** (`xoxb-...`).
4. Go to **Basic Information**.
5. Copy the **Signing Secret**.

---

## Step 5) Add settings in your `Settings` sheet tab

Add rows for these keys:

- `SLACK_SIGNING_SECRET` = (paste Slack signing secret)
- `SLACK_BOT_TOKEN` = (paste bot token)
- `WEBHOOK_MAX_SKEW_SECONDS` = `300`
- `APP_ENV` = `prod`

Optional but recommended:

- `QUEUE_MAX_ATTEMPTS` = `3`
- `QUEUE_BACKOFF_SECONDS` = `60`
- `QUEUE_STALE_LOCK_SECONDS` = `300`

---

## Step 6) Deploy Apps Script as a web app

1. In Apps Script click **Deploy** → **New deployment**.
2. Type: **Web app**.
3. **Execute as**: Me
4. **Who has access**: Anyone
5. Click **Deploy**.
6. Copy the web app URL.

Keep this URL safe. You need it for Slack.

---

## Step 7) Connect Slack to your web app URL

In Slack app settings, paste the same Apps Script URL into:

- Slash command request URLs
- Interactivity request URL
- Event subscription request URL (if you use events)

If your manifest still contains `https://YOUR_APPS_SCRIPT_WEB_APP_URL`, replace it with your real URL and re-apply.

---

## Step 8) Add starter learning data

In your Google Sheet, add at least:

- 1 track
- 2 lessons in that track
- 1 learner user
- 1 admin user

Without this, commands may run but show nothing useful.

---

## Step 9) Add automatic triggers in Apps Script

In Apps Script:

1. Click **Triggers** (clock icon)
2. Add these time-based triggers:
   - Queue worker: every 5 minutes
   - Delivery scan: every hour
   - Reminder scan: every hour

This is what makes the bot run automatically.

---

## Step 10) Test in Slack

Run these commands in Slack:

1. `/onboard`
2. `/learn`
3. `/complete`
4. `/progress`

You should see onboarding, lesson delivery, completion updates, and progress responses.

---

## Common problems (simple fixes)

- **Slack says request failed**
  - Check the web app URL is correct and deployed.
- **Signature/auth error**
  - Check `SLACK_SIGNING_SECRET` exactly matches Slack.
- **Bot does not reply**
  - Check `SLACK_BOT_TOKEN` and app install status.
- **No lesson appears**
  - Add track + lessons + enrollment rows.
- **Jobs stuck**
  - Check `Queue` tab and trigger setup.

---

## Quick go-live checklist

- [ ] Web app deployed
- [ ] Slack token + signing secret saved in `Settings`
- [ ] Slack request URLs use your Apps Script URL
- [ ] Track and lessons are seeded
- [ ] Triggers are enabled
- [ ] `/learn` and `/progress` work

If all boxes are checked, your Slack LMS bot is live. 🎉
