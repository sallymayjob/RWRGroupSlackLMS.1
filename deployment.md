# Deployment Walkthrough (Very Beginner Friendly)

This is a click-by-click setup for people with little or no technical background.

Goal: connect **Slack + Google Sheets + Apps Script** so your LMS bot works.

---

## What you are building

- A Slack app that receives commands
- A Google Sheet that stores LMS data
- A Google Apps Script web app that runs the bot logic

---

## Time needed

Plan for **45–90 minutes** the first time.

---

## Checklist of accounts/tools

You need:

- [ ] Google account
- [ ] Slack workspace admin/app-creation access
- [ ] This GitHub repo downloaded as ZIP

---

## Step 1: Download the project files

1. Open the repository on GitHub.
2. Click **Code** → **Download ZIP**.
3. Unzip the folder.
4. Keep this folder open; you will copy files from `appscript/`.

---

## Step 2: Create your Google Sheet

1. Open Google Sheets.
2. Create a blank spreadsheet.
3. Rename it: **Slack LMS SoR**.
4. Add these tabs:

`Settings`, `Users`, `Tracks`, `Lessons`, `Enrollments`, `Progress`, `Deliveries`, `Reminders`, `Queue`, `Audit_Log`, `Error_Log`, `Gem_Roles`, `Prompt_Configs`, `Content_Pipeline`, `Generated_Drafts`, `QA_Results`, `Publish_Queue`

---

## Step 3: Create Apps Script project and paste code

1. Go to <https://script.google.com>.
2. Click **New project**.
3. Delete the sample code in the default file.
4. From your local repo’s `appscript/` folder, create matching `.gs` files in Apps Script and paste each file’s content.
5. Confirm a file named `Code.gs` exists (this is important: it contains the public web entry functions).

You do not need to understand the code to do this step.

---

## Step 4: Create Slack app using `manifest.json`

1. Open <https://api.slack.com/apps>.
2. Click **Create New App**.
3. Choose **From an app manifest**.
4. Open local `manifest.json` from this repo.
5. Copy and paste it into Slack.
6. Click create.

Then install it:

1. Open **OAuth & Permissions**.
2. Click **Install to Workspace**.
3. Copy **Bot User OAuth Token** (`xoxb-...`).
4. Open **Basic Information**.
5. Copy **Signing Secret**.

---

## Step 5: Fill settings in your Sheet

In `Settings` tab, add key/value rows:

Required:

- `SLACK_SIGNING_SECRET` = (your Slack signing secret)
- `SLACK_BOT_TOKEN` = (your Slack bot token)
- `WEBHOOK_MAX_SKEW_SECONDS` = `300`
- `APP_ENV` = `prod`

Recommended:

- `QUEUE_MAX_ATTEMPTS` = `3`
- `QUEUE_BACKOFF_SECONDS` = `60`
- `QUEUE_STALE_LOCK_SECONDS` = `300`

---

## Step 6: Deploy Apps Script as Web App

1. In Apps Script, click **Deploy**.
2. Click **New deployment**.
3. Select **Web app**.
4. Set **Execute as** = Me.
5. Set **Who has access** = Anyone.
6. Click **Deploy**.
7. Copy the generated Web App URL.

---

## Step 7: Put Web App URL into Slack

Use the same URL for:

- Slash command Request URLs
- Interactivity Request URL
- Event Subscriptions Request URL (if enabled)

If manifest still shows `https://YOUR_APPS_SCRIPT_WEB_APP_URL`, replace with your real URL and update the app.

---

## Step 8: Seed minimum LMS data

Add basic records to your Sheet:

- At least 1 track
- At least 2 lessons linked to that track
- At least 1 learner user
- At least 1 admin user

This prevents “empty response” behavior.

---

## Step 9: Add automation triggers

In Apps Script → **Triggers**:

Create time-based triggers for these jobs:

- Queue worker: every 5 minutes
- Delivery scan: every hour
- Reminder scan: every hour

---

## Step 10: Do first live test in Slack

Run these commands:

1. `/onboard`
2. `/learn`
3. `/complete`
4. `/progress`

Expected results:

- user onboarded
- lesson delivered
- completion recorded
- progress shown

---

## If something is wrong

### Slack command fails
- Check the Request URL is your latest deployed Apps Script URL.

### Unauthorized/signature error
- Recheck `SLACK_SIGNING_SECRET` in Settings tab.

### Bot not replying
- Recheck `SLACK_BOT_TOKEN` and reinstall app to workspace.

### No lessons are shown
- Ensure Tracks and Lessons tabs have data.

### Queue is not moving
- Ensure triggers are enabled and check Queue/Error_Log tabs.

---

## Final go-live checklist

- [ ] Apps Script deployed successfully
- [ ] Slack URLs point to correct web app URL
- [ ] Token + signing secret stored in Settings
- [ ] Seed data added (track, lessons, users)
- [ ] Triggers enabled
- [ ] `/learn` and `/progress` work in Slack

Done! Your Slack LMS is ready for real users. 🚀
