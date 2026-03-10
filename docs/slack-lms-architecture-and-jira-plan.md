# Slack LMS + Onboarding + Lesson Delivery + Content Factory (Gemini/Gems)  
**Stack:** Slack App, Google Apps Script, Google Sheets, Google Gemini, Gemini Gems

## 1) Executive summary
This system delivers a Slack-native LMS and AI content factory using only Slack, Apps Script, Sheets, Gemini, and Gems. Google Sheets is the single system of record for learner state and content pipeline state. Apps Script handles ingestion, orchestration, scheduling, queue processing, and fault recovery. Slack is the learner/admin UX surface. Gemini + Gems provide structured content generation, QA, and publishing workflows.

## 2) Full system architecture overview
```text
[Slack Users/Admins]
      |
      v
[Slack App: commands/events/actions/modals]
      |
      v  HTTPS
[Apps Script Web App Endpoint]
      |
      +--> [Slack Request Verifier]
      +--> [Router: events/commands/actions/views]
      |
      +--> [Domain Engines]
      |      - Onboarding
      |      - Lesson Delivery
      |      - Progress
      |      - Reminder
      |      - Approval
      |      - Content Pipeline / QA / Publish
      |
      +--> [Queue Processor + Scheduler]
      |
      +--> [Sheets DAL] -> [Google Sheets Tabs (SoR)]
      |
      +--> [Gemini Service + Gem Invocation Layer]
      |
      +--> [Notification Service -> Slack API]
      |
      +--> [Logging Service -> Audit_Log / Error_Log]
```

## 3) Architecture principles
- Sheets-first source of truth.
- Idempotent handlers for all externally-triggered actions.
- Queue-first execution for heavy or retryable work.
- Deterministic policy via `Workflow_Rules` + `Settings`.
- Full operational auditability.
- Manual recoverability for failures.
- Least privilege for Slack scopes and admin actions.
- Explicit AI roles via Gem mappings.

## 4) Core modules and responsibilities
Each module includes purpose / inputs / outputs / dependencies / error handling.

### Slack App
- Purpose: Learner/admin interaction channel.
- Inputs: slash commands, interactive actions, events.
- Outputs: DMs, ephemeral messages, modals.
- Dependencies: Slack API + Apps Script endpoint.
- Errors: ephemeral user-safe error + backend log.

### Apps Script Web App endpoint
- Purpose: ingress and immediate acknowledgement.
- Inputs: Slack POST payload.
- Outputs: 200 ACK + deferred queued work.
- Dependencies: verifier/router/logging.
- Errors: catch-all with `trace_id` + Error_Log row.

### Slack request verifier
- Purpose: validate Slack signature + timestamp.
- Inputs: headers + raw body.
- Outputs: allow/deny.
- Dependencies: signing secret in protected Settings.
- Errors: reject unauthorized and log security event.

### Event/command/shortcut router
- Purpose: map request type to engine.
- Inputs: normalized request envelope.
- Outputs: engine call or queued job.
- Dependencies: command map + role guard.
- Errors: unknown route fallback message.

### Modal builder
- Purpose: render typed modal JSON.
- Inputs: workflow context + template id.
- Outputs: Slack modal payload.
- Dependencies: Message_Templates.
- Errors: fallback minimal modal + template mismatch log.

### Onboarding engine
- Purpose: user setup + cohort/track enrollment.
- Inputs: `/onboard`, imports, profile data.
- Outputs: Users + Enrollments + initial queue record.
- Dependencies: Users/Cohorts/Tracks repos.
- Errors: validation failures into Admin_Actions queue.

### Lesson delivery engine
- Purpose: determine lesson eligibility and send lesson.
- Inputs: enrollment/progress/rules/time.
- Outputs: Deliveries rows + Slack sends.
- Dependencies: lessons/progress/notification service.
- Errors: safe retries via Queue with idempotency key.

### Progress engine
- Purpose: completion/check-in state transitions.
- Inputs: `/complete`, button, modal.
- Outputs: Progress updates + optional next lesson job.
- Dependencies: progress + delivery repos.
- Errors: dedupe by delivery/event key.

### Reminder engine
- Purpose: overdue nudges and escalation.
- Inputs: due dates, status, reminder policy.
- Outputs: Reminders rows + Slack notices.
- Dependencies: rules/settings/users.
- Errors: duplicate suppression + max retries.

### Approval engine
- Purpose: manager/admin gating flows.
- Inputs: approval-needed events.
- Outputs: Approvals rows + decision callbacks.
- Dependencies: role model + notifications.
- Errors: timeout escalations and manual override path.

### Scheduler engine
- Purpose: enqueue periodic work.
- Inputs: Apps Script time triggers.
- Outputs: queue jobs (`DELIVERY_SCAN`, `REMINDER_SCAN`, etc.).
- Dependencies: queue repo.
- Errors: heartbeat + missed run alert.

### Queue processor
- Purpose: run jobs with lock/retry/backoff.
- Inputs: pending queue rows.
- Outputs: status transitions + downstream effects.
- Dependencies: all engines.
- Errors: dead-letter status after max attempts.

### Sheets DAL
- Purpose: typed read/write with schema checks.
- Inputs: repository operations.
- Outputs: normalized entities.
- Dependencies: SpreadsheetApp.
- Errors: strict validation + structured logging.

### Config service
- Purpose: central runtime settings access.
- Inputs: key lookup.
- Outputs: typed config object.
- Dependencies: Settings + Workflow_Rules.
- Errors: defaults + warning log.

### Notification service
- Purpose: message composition and delivery.
- Inputs: template + vars + destination.
- Outputs: Slack API result with message ids.
- Dependencies: Slack client + templates.
- Errors: transient retries + throttle handling.

### Logging/monitoring service
- Purpose: audit trail and operational visibility.
- Inputs: event/action/error envelopes.
- Outputs: Audit_Log and Error_Log rows.
- Dependencies: DAL.
- Errors: fail-open minimal logs if contention.

### Gemini service
- Purpose: call Gemini models for generation/transformation.
- Inputs: prompt + content context.
- Outputs: structured response payload.
- Dependencies: API key/model config.
- Errors: timeout/retry/fallback profile.

### Gem invocation layer
- Purpose: role-based Gem routing.
- Inputs: role name + task payload.
- Outputs: artifact + metadata.
- Dependencies: Gem_Roles + Prompt_Configs.
- Errors: invalid role -> block + admin alert.

### Content pipeline engine
- Purpose: content lifecycle orchestration.
- Inputs: briefs, scope, track map.
- Outputs: Content_Pipeline + Generated_Drafts transitions.
- Dependencies: Gemini/Gems + QA engine.
- Errors: per-stage retry and resumable status.

### Content QA engine
- Purpose: pedagogical/brand/rubric scoring.
- Inputs: draft artifacts + rubrics.
- Outputs: QA_Results pass/fail with findings.
- Dependencies: QA roles (PED-01..06, QA Reviewer, Brand).
- Errors: isolated check failures; manual override gate.

### Publishing sync engine
- Purpose: publish approved content into lessons.
- Inputs: approved Publish_Queue records.
- Outputs: Lesson_Content updates + publish audit.
- Dependencies: lessons/content repos.
- Errors: staged commit pattern with rollback marker.

## 5) Slack app design
### Bot scopes
- `commands`
- `chat:write`
- `chat:write.public` (optional)
- `im:read`
- `im:write`
- `users:read`
- `users:read.email` (optional)

### Event subscriptions
- `app_home_opened`
- `message.im` (optional help mode)
- `team_join` (optional onboarding trigger)

### Commands
- `/learn`, `/progress`, `/lesson`, `/complete`, `/onboard`, `/admin`, `/cohort`, `/resend`

### Shortcuts
- Global: assign learner to cohort.
- Message: create lesson draft, request approval.

### Interactions
- Buttons: Complete, Need Help, Request Extension, Approve/Reject, Pause/Resume, Resend.
- Modals: onboarding, cohort assignment, approvals, content brief, recovery panel.

### DM behavior & permissions
- Learners primarily in bot DM.
- Admin alerts in DM + optional admin channel summary.
- Admin/manager access validated by Users role mapping.

## 6) Google Sheets schema
Tabs:
`Users`, `Cohorts`, `Tracks`, `Lessons`, `Lesson_Content`, `Enrollments`, `Progress`, `Deliveries`, `Reminders`, `Approvals`, `Message_Templates`, `Workflow_Rules`, `Settings`, `Audit_Log`, `Error_Log`, `Queue`, `Admin_Actions`, `Content_Pipeline`, `Prompt_Configs`, `Gem_Roles`, `QA_Results`, `Publish_Queue`, `Generated_Drafts`.

## 7) Column-level schema examples (abbreviated)
- **Users** PK `USR-<workspace>-<slackUserId>`; FK `manager_user_id -> Users.user_id`
- **Enrollments** PK `ENR-<user_id>-<track_id>`
- **Progress** PK `PRG-<enrollment_id>-<lesson_id>`
- **Deliveries** PK `DLV-<user_id>-<lesson_id>-<yyyymmdd>` + `idempotency_key`
- **Reminders** PK `RMD-<delivery_id>-<n>`
- **Queue** PK `JOB-<timestamp>-<seq>` with `attempt_count`, `next_attempt_at`, `status`
- **Content_Pipeline** PK `CP-<scope>-<seq>`
- **Generated_Drafts** PK `DRF-<scope>-<timestamp>`
- **QA_Results** PK `QAR-<draft_id>-<check>`
- **Publish_Queue** PK `PUB-<content_id>-<version>`

Operational notes:
- Add `row_version` + `last_updated_at` on hot tables.
- Use protected ranges for secrets and admin-only columns.
- Enforce enums via validation lists.

## 8) Apps Script codebase architecture
```text
/src
  /web
    doPost.js
    requestVerifier.js
    router.js
  /slack
    slackClient.js
    commandHandlers.js
    eventHandlers.js
    actionHandlers.js
    modalBuilder.js
  /engines
    onboardingEngine.js
    lessonDeliveryEngine.js
    progressEngine.js
    reminderEngine.js
    approvalEngine.js
    schedulerEngine.js
    queueProcessor.js
    contentPipelineEngine.js
    contentQAEngine.js
    publishingSyncEngine.js
  /ai
    geminiService.js
    gemInvocationLayer.js
  /data
    dal.js
    repositories/*.js
  /services
    configService.js
    notificationService.js
    loggingService.js
    idempotencyService.js
  /jobs
    runQueueWorker.js
    runDeliveryScan.js
    runReminderScan.js
    runReportingRollup.js
  /utils
    validators.js
    locks.js
    dates.js
    ids.js
```

## 9) Workflow diagrams
```text
Onboarding:
/onboard -> Router -> OnboardingEngine
  -> Users upsert
  -> Enrollments create
  -> Queue(first lesson)
  -> DM confirmation

Scheduled Delivery:
Trigger -> Scheduler -> Queue(DELIVERY_SCAN)
  -> QueueProcessor -> LessonDeliveryEngine
  -> Deliveries create -> Slack DM
  -> Progress=delivered

Completion:
/complete or button -> ProgressEngine
  -> idempotency check
  -> Progress=completed
  -> enqueue next lesson (self-paced)

AI Content:
Admin brief -> ContentPipelineEngine
  -> Gem roles generate drafts
  -> QA checks (PED/Brand/QA Reviewer)
  -> Publish_Queue
  -> PublishingSync -> Lesson_Content publish
```

## 10) Lesson delivery engine design
- Eligibility: active enrollment, not paused, next eligible lesson, release rule satisfied.
- Cadence: scheduled (daily/weekly/monthly) and self-paced.
- Idempotency: `user_id + lesson_id + schedule_bucket`.
- Delivery states: `queued -> sent -> acknowledged -> completed|overdue|failed`.

## 11) Progress tracking design
- Single row per enrollment+lesson.
- State model: `not_started -> delivered -> in_progress -> completed` (+ `blocked`, `waived`).
- Completion sources: slash command, button, modal, admin override.

## 12) Reminder architecture
- Policy examples: +24h nudge, +72h escalate, +7d manager notify.
- Suppression: completed, paused, quiet hours, max reminders.
- Idempotency: one reminder per `(delivery_id, reminder_no)`.

## 13) Queue and scheduler design
- Triggers: every 5 min worker; hourly delivery/reminder scan; daily reporting.
- Locking: `lock_owner` + lock timestamp TTL.
- Retry: configurable backoff in Settings.
- Dead-letter: `failed_permanent` for manual recovery.

## 14) Security architecture
- Slack signature validation and drift checks.
- Secrets in protected Settings/Script Properties.
- Role-based command authorization.
- PII redaction in logs.
- Audit all admin actions and overrides.

## 15) Reliability and scalability
- Batch reads/writes to reduce Sheets quotas.
- Fast webhook ACK + deferred queue work.
- Archive old logs to monthly tabs/spreadsheet.
- Notification throttling for Slack rate limits.

## 16) Admin operating model
- Daily: failed jobs, overdue learners, pending approvals.
- Weekly: cohort performance and QA backlog.
- Monthly: prompt/rules governance and tuning.
- Controls: pause/resume, resend, reassign, force-complete, retry DLQ.

## 17) Reporting/dashboard design
- Learner dashboard: completion %, next lesson, overdue count.
- Cohort dashboard: active learners, completion curve, SLA alerts.
- Content dashboard: pipeline stage counts, QA pass rates.
- Ops dashboard: queue depth, retries, top error modules.

## 18) Sample Slack message patterns
- **Lesson DM:** objective + time estimate + action buttons.
- **Reminder DM:** overdue message + extension/resume actions.
- **Approval DM:** approve/reject/revise actions.
- **Admin alert:** failed job with retry/reschedule controls.

## 19) File/folder structure
- One spreadsheet (SoR tabs).
- One bound Apps Script project.
- Optional archive spreadsheet for historical logs.
- Deployment tags: `prod-vX.Y.Z`.

## 20) MVP build plan
1. Foundation/security
2. Schema/DAL
3. Slack learner flows
4. Engines (onboarding/delivery/progress/reminder/approval)
5. Queue/scheduler/reliability
6. Gemini/Gems pipeline
7. Admin/reporting
8. Hardening/runbooks

## 21) Example use cases
- New hire onboarding assigns baseline track and queues first lesson.
- Self-paced learner auto-unlocks next lesson after completion.
- Approval-gated capstone waits for manager decision.
- Content refresh pipeline produces and publishes new lesson version.

## 22) Risks and limitations
- Apps Script quotas/runtime limits.
- Sheets concurrency contention at higher scale.
- Slack API rate limits.
- AI output quality requires prompt and rubric governance.

## 23) Final recommendation
Adopt queue + idempotency + DAL from day one. Launch with one pilot cohort/track, then scale tracks, approvals, and Gem specialization after reliability baselines are proven.

---

# Fully prioritized Jira-style task list (60 tickets)
Assumptions: 6 sprints (2 weeks), priorities `P0/P1/P2`, dependencies by ticket id.

## Reviewer-prioritized bootstrap chain
`LMS-001 → LMS-002 → LMS-003 → LMS-004 → LMS-008`

This sequence is the mandatory day-0 dependency chain and should be executed before expanding into schema, engines, or AI pipeline work.

## Sprint 1 — Platform foundation & security
| Rank | ID | Title | Priority | Depends On |
|---:|---|---|---|---|
| 1 | LMS-001 | Initialize Apps Script module structure | P0 | — |
| 2 | LMS-002 | Bootstrap Settings tab + secure key loader | P0 | LMS-001 |
| 3 | LMS-003 | Implement Slack signature + timestamp verifier | P0 | LMS-001, LMS-002 |
| 4 | LMS-004 | Build webhook ingress and ACK strategy | P0 | LMS-003 |
| 5 | LMS-005 | Add trace-id middleware + context propagation | P1 | LMS-004 |
| 6 | LMS-006 | Implement Audit_Log and Error_Log services | P0 | LMS-001 |
| 7 | LMS-007 | Build config service w/ defaults + cache | P1 | LMS-002 |
| 8 | LMS-008 | Build base request router | P0 | LMS-004 |
| 9 | LMS-009 | Add role-guard middleware | P1 | LMS-008, LMS-007 |
| 10 | LMS-010 | Build Slack client wrapper w/ retry hooks | P0 | LMS-002 |

## Sprint 2 — Schema, DAL, core command shell
| Rank | ID | Title | Priority | Depends On |
|---:|---|---|---|---|
| 11 | LMS-011 | Create tab schema bootstrap script | P0 | LMS-001 |
| 12 | LMS-012 | Define column dictionaries + enum validators | P0 | LMS-011 |
| 13 | LMS-013 | Implement DAL base helpers | P0 | LMS-011, LMS-012 |
| 14 | LMS-014 | Build Users repository | P0 | LMS-013 |
| 15 | LMS-015 | Build Cohorts/Tracks/Lessons repositories | P0 | LMS-013 |
| 16 | LMS-016 | Build Enrollments/Progress/Deliveries/Reminders repositories | P0 | LMS-013 |
| 17 | LMS-017 | Build Queue/Approvals/Admin_Actions repositories | P0 | LMS-013 |
| 18 | LMS-018 | Build content pipeline repositories | P1 | LMS-013 |
| 19 | LMS-019 | Implement ID utility package | P1 | LMS-013 |
| 20 | LMS-020 | Implement idempotency utility + lookup | P0 | LMS-013 |
| 21 | LMS-021 | Implement `/learn`, `/progress`, `/lesson` handlers | P1 | LMS-008, LMS-010, LMS-014, LMS-016 |
| 22 | LMS-022 | Implement modal builder + template resolver | P1 | LMS-010, LMS-013 |

## Sprint 3 — Learner lifecycle MVP
| Rank | ID | Title | Priority | Depends On |
|---:|---|---|---|---|
| 23 | LMS-023 | Build onboarding engine | P0 | LMS-014, LMS-009 |
| 24 | LMS-024 | Implement `/onboard` flow + modal submit | P0 | LMS-023, LMS-022, LMS-008 |
| 25 | LMS-025 | Build cohort assignment service | P1 | LMS-015, LMS-023 |
| 26 | LMS-026 | Implement enrollment creation service | P0 | LMS-016, LMS-023 |
| 27 | LMS-027 | Implement lesson eligibility rules | P0 | LMS-015, LMS-016, LMS-020 |
| 28 | LMS-028 | Implement lesson delivery renderer + sends | P0 | LMS-010, LMS-022, LMS-027 |
| 29 | LMS-029 | Implement `/complete` and completion action | P0 | LMS-016, LMS-020, LMS-008 |
| 30 | LMS-030 | Implement progress state machine | P0 | LMS-016, LMS-029 |
| 31 | LMS-031 | Implement self-paced next-lesson unlock | P1 | LMS-027, LMS-030 |
| 32 | LMS-032 | Implement `/resend` command | P1 | LMS-028, LMS-009 |
| 33 | LMS-033 | Add safe DM fallback + error UX standard | P1 | LMS-010, LMS-006 |
| 34 | LMS-034 | Add starter seed data package | P2 | LMS-011, LMS-015, LMS-022 |

## Sprint 4 — Queue, scheduler, reminders, approvals
| Rank | ID | Title | Priority | Depends On |
|---:|---|---|---|---|
| 35 | LMS-035 | Implement queue lifecycle model | P0 | LMS-017 |
| 36 | LMS-036 | Implement queue locking + stale lock recovery | P0 | LMS-035 |
| 37 | LMS-037 | Build queue worker w/ retry + backoff | P0 | LMS-036, LMS-006 |
| 38 | LMS-038 | Implement scheduler engine + trigger manager | P0 | LMS-037 |
| 39 | LMS-039 | Build delivery scan job enqueue | P0 | LMS-027, LMS-038 |
| 40 | LMS-040 | Build reminder scan job enqueue | P0 | LMS-016, LMS-038 |
| 41 | LMS-041 | Implement reminder engine + suppressions | P0 | LMS-040, LMS-020 |
| 42 | LMS-042 | Implement overdue escalation policy | P1 | LMS-041, LMS-014 |
| 43 | LMS-043 | Implement approval engine | P1 | LMS-017, LMS-010, LMS-009 |
| 44 | LMS-044 | Implement dead-letter + admin retry | P0 | LMS-037, LMS-017 |
| 45 | LMS-045 | Implement heartbeat + missed-run monitors | P1 | LMS-038, LMS-006 |

## Sprint 5 — Admin operations + reporting
| Rank | ID | Title | Priority | Depends On |
|---:|---|---|---|---|
| 46 | LMS-046 | Implement `/admin` command + recovery modal | P0 | LMS-022, LMS-009 |
| 47 | LMS-047 | Add pause/resume/reassign/force-complete/resend admin actions | P0 | LMS-046, LMS-016, LMS-017 |
| 48 | LMS-048 | Implement `/cohort` command | P1 | LMS-015, LMS-046 |
| 49 | LMS-049 | Build learner dashboard view | P1 | LMS-016 |
| 50 | LMS-050 | Build cohort dashboard view | P1 | LMS-049, LMS-015 |
| 51 | LMS-051 | Build ops dashboard view | P1 | LMS-035, LMS-037, LMS-006 |
| 52 | LMS-052 | Implement reporting rollup job | P1 | LMS-049, LMS-050, LMS-051, LMS-038 |
| 53 | LMS-053 | Add admin runbook metadata and links | P2 | LMS-047, LMS-006 |

## Sprint 6 — Gemini/Gems content factory
| Rank | ID | Title | Priority | Depends On |
|---:|---|---|---|---|
| 54 | LMS-054 | Implement Gemini service wrapper | P0 | LMS-007, LMS-006 |
| 55 | LMS-055 | Implement Gem invocation layer | P0 | LMS-054, LMS-018 |
| 56 | LMS-056 | Implement content pipeline stage machine | P0 | LMS-018, LMS-055 |
| 57 | LMS-057 | Implement multi-role draft generation flow | P0 | LMS-056 |
| 58 | LMS-058 | Implement QA engine (PED-01..06 + QA reviewer + brand) | P0 | LMS-057, LMS-018 |
| 59 | LMS-059 | Implement publishing sync engine | P0 | LMS-058, LMS-015 |
| 60 | LMS-060 | Add content admin controls + rollback + audit | P1 | LMS-046, LMS-056, LMS-059 |

## Epics mapping
- EPIC-A Platform & Security: LMS-001..010
- EPIC-B Data Model & DAL: LMS-011..020
- EPIC-C Learner Experience: LMS-021..034
- EPIC-D Reliability & Automation: LMS-035..045
- EPIC-E Admin Ops & Reporting: LMS-046..053
- EPIC-F AI Content Factory: LMS-054..060

## Critical path
`LMS-001 -> LMS-002 -> LMS-003 -> LMS-004 -> LMS-008 -> LMS-011 -> LMS-013 -> LMS-014/LMS-015/LMS-016/LMS-017 -> LMS-020 -> LMS-023 -> LMS-027 -> LMS-029 -> LMS-035 -> LMS-037 -> LMS-038 -> LMS-039/LMS-040 -> LMS-054 -> LMS-055 -> LMS-056 -> LMS-057 -> LMS-058 -> LMS-059`
