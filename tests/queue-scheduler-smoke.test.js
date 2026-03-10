const assert = require('assert');
const { createInMemorySheetAdapter } = require('../src/data/inMemorySheetAdapter');
const { createDal } = require('../src/data/dal');
const { createAdminOpsRepo, createLearningOpsRepo } = require('../src/data/repositories');
const { createSchedulerEngine } = require('../src/engines/schedulerEngine');
const { createQueueProcessor } = require('../src/engines/queueProcessor');
const { createDeliveryScanEngine } = require('../src/engines/deliveryScanEngine');
const { createReminderScanEngine } = require('../src/engines/reminderScanEngine');
const { createReminderEngine } = require('../src/engines/reminderEngine');
const { createIdempotencyService } = require('../src/services/idempotencyService');
const { createNotificationService } = require('../src/services/notificationService');
const { createSlackClient } = require('../src/slack/slackClient');

(function testQueueSchedulerAndScans() {
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter, { now: () => '2026-03-10T00:00:00Z' });
  const adminOpsRepo = createAdminOpsRepo(dal, { now: () => '2026-03-10T00:00:00Z' });
  const learningOpsRepo = createLearningOpsRepo(dal);

  learningOpsRepo.upsertEnrollment({
    enrollment_id: 'ENR-1',
    user_id: 'USR-1',
    track_id: 'TRK-1',
    pace_mode: 'scheduled',
    paused_flag: 'false',
  });

  learningOpsRepo.createDelivery({
    delivery_id: 'DLV-1',
    user_id: 'USR-1',
    lesson_id: 'LES-1',
    status: 'sent',
    sent_at: '2026-03-09T00:00:00Z',
    idempotency_key: 'USR-1|LES-1|20260309',
  });

  const schedulerEngine = createSchedulerEngine({
    adminOpsRepo,
    idGenerator: { jobId: (type) => `JOB-${type}-${Math.random().toString(16).slice(2, 8)}` },
    now: () => '2026-03-10T00:00:00Z',
  });

  schedulerEngine.enqueueDeliveryScan();
  schedulerEngine.enqueueReminderScan();

  const deliveryScanEngine = createDeliveryScanEngine({
    learningOpsRepo,
    schedulerEngine,
    now: () => '2026-03-10T00:00:00Z',
  });
  const deliveryScanResult = deliveryScanEngine.scanAndEnqueue();
  assert.equal(deliveryScanResult.queued, 1);

  const slackClient = createSlackClient({ postMessageImpl: (payload) => ({ ok: true, ts: '1700.1', channel: payload.channel }) });
  const notificationService = createNotificationService({ slackClient, now: () => '2026-03-10T01:00:00Z' });
  const idempotencyService = createIdempotencyService({ learningOpsRepo });
  const reminderEngine = createReminderEngine({ learningOpsRepo, idempotencyService, notificationService, now: () => '2026-03-10T01:00:00Z' });

  const reminderScanEngine = createReminderScanEngine({
    reminderEngine,
    schedulerEngine,
    now: () => '2026-03-10T01:00:00Z',
  });
  const reminderScanResult = reminderScanEngine.scanAndEnqueue();
  assert.equal(reminderScanResult.queued, 1);

  const send = reminderEngine.sendReminderForDelivery(learningOpsRepo.listDeliveriesByUserAndLesson('USR-1', 'LES-1')[0], 1);
  assert.equal(send.sent, true);

  const duplicate = reminderEngine.sendReminderForDelivery(learningOpsRepo.listDeliveriesByUserAndLesson('USR-1', 'LES-1')[0], 1);
  assert.equal(duplicate.sent, false);

  const queueProcessor = createQueueProcessor({
    adminOpsRepo,
    handlers: {
      DELIVERY_SCAN: () => ({ ok: true }),
      REMINDER_SCAN: () => ({ ok: true }),
      DELIVER_NEXT_LESSON: () => ({ ok: true }),
      SEND_REMINDER: () => ({ ok: true }),
    },
    config: { maxAttempts: 2, backoffSeconds: 1, lockOwner: 'test-worker', staleLockSeconds: 10 },
    now: () => new Date('2026-03-10T02:00:00Z'),
  });

  const firstRun = queueProcessor.runOnce();
  assert.equal(firstRun.processed, true);

  // Isolated retry path assertion
  const adapter2 = createInMemorySheetAdapter();
  const dal2 = createDal(adapter2, { now: () => '2026-03-10T00:00:00Z' });
  const adminOpsRepo2 = createAdminOpsRepo(dal2, { now: () => '2026-03-10T00:00:00Z' });
  adminOpsRepo2.enqueue({
    job_id: 'JOB-FAIL-1',
    job_type: 'SEND_REMINDER',
    payload_json: '{}',
    status: 'pending',
  });

  const failingProcessor = createQueueProcessor({
    adminOpsRepo: adminOpsRepo2,
    handlers: { SEND_REMINDER: () => { throw new Error('boom'); } },
    config: { maxAttempts: 2, backoffSeconds: 1, lockOwner: 'test-worker', staleLockSeconds: 10 },
    now: () => new Date('2026-03-10T03:00:00Z'),
  });

  const retryResult = failingProcessor.runOnce();
  assert.equal(retryResult.status, 'retry');
})();

console.log('All LMS-035/036/037/038/039/040/041 smoke tests passed.');
