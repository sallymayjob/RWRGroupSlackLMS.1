# LMS Queue/Scheduler Implementation (LMS-035 → LMS-036 → LMS-037 → LMS-038 → LMS-039/040/041)

Implemented modules:

- **LMS-035** queue lifecycle states and transitions in `src/engines/queueProcessor.js` + `src/data/repositories/adminOpsRepo.js`.
- **LMS-036** queue claim/lock and stale lock recovery in `adminOpsRepo.claimNextJob`.
- **LMS-037** worker execution with retry/backoff and permanent-fail handling in `queueProcessor.runOnce`.
- **LMS-038** scheduler queue enqueueing for delivery/reminder scans in `src/engines/schedulerEngine.js`.
- **LMS-039** delivery scan job generation in `src/engines/deliveryScanEngine.js`.
- **LMS-040** reminder scan job generation in `src/engines/reminderScanEngine.js`.
- **LMS-041** reminder detection + send/idempotency handling in `src/engines/reminderEngine.js`.

Supporting updates:
- Extended `learningOpsRepo` for due-delivery queries.
- Extended `notificationService` to send reminder messages.
- Added full smoke coverage in `tests/queue-scheduler-smoke.test.js`.

## Validation

```bash
npm test
```
