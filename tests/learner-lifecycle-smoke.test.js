const assert = require('assert');
const { createInMemorySheetAdapter } = require('../src/data/inMemorySheetAdapter');
const { createDal } = require('../src/data/dal');
const {
  createUsersRepo,
  createCurriculumRepo,
  createLearningOpsRepo,
} = require('../src/data/repositories');
const { createIdempotencyService } = require('../src/services/idempotencyService');
const { createNotificationService } = require('../src/services/notificationService');
const { createSlackClient } = require('../src/slack/slackClient');
const { createOnboardingEngine } = require('../src/engines/onboardingEngine');
const { createLessonDeliveryEngine } = require('../src/engines/lessonDeliveryEngine');
const { createProgressEngine } = require('../src/engines/progressEngine');

(function testLearnerLifecycleChain() {
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter, { now: () => '2026-03-10T00:00:00Z' });

  const usersRepo = createUsersRepo(dal);
  const curriculumRepo = createCurriculumRepo(dal);
  const learningOpsRepo = createLearningOpsRepo(dal);

  curriculumRepo.upsertTrack({ track_id: 'TRK-onboard-101', title: 'Onboarding 101', active_flag: 'true' });
  curriculumRepo.upsertLesson({ lesson_id: 'LES-001', track_id: 'TRK-onboard-101', sequence_no: 1, title: 'Welcome' });
  curriculumRepo.upsertLesson({ lesson_id: 'LES-002', track_id: 'TRK-onboard-101', sequence_no: 2, title: 'Team Norms' });

  const onboardingEngine = createOnboardingEngine({ usersRepo, curriculumRepo, learningOpsRepo });

  const onboarded = onboardingEngine.onboardLearner({
    user: {
      user_id: 'USR-main-U42',
      slack_user_id: 'U42',
      email: 'u42@example.com',
      full_name: 'Learner 42',
    },
    trackId: 'TRK-onboard-101',
    paceMode: 'self',
  });

  assert.equal(onboarded.user.role, 'learner');
  assert.equal(onboarded.enrollment.track_id, 'TRK-onboard-101');

  const slackClient = createSlackClient({
    postMessageImpl: (payload) => ({ ok: true, ts: '1700000000.000001', channel: payload.channel || 'D42' }),
  });
  const notificationService = createNotificationService({
    slackClient,
    now: () => '2026-03-10T10:00:00Z',
  });
  const idempotencyService = createIdempotencyService({ learningOpsRepo });

  const lessonDeliveryEngine = createLessonDeliveryEngine({
    curriculumRepo,
    learningOpsRepo,
    idempotencyService,
    notificationService,
  });

  const firstDelivery = lessonDeliveryEngine.deliverNextLesson({
    enrollment: onboarded.enrollment,
    scheduleBucket: '20260310',
    channelId: 'D42',
    traceId: 'trace-delivery-1',
  });

  assert.equal(firstDelivery.delivered, true);
  assert.equal(firstDelivery.lesson.lesson_id, 'LES-001');

  const progressEngine = createProgressEngine({ learningOpsRepo, lessonDeliveryEngine });
  const completion = progressEngine.completeAndResolveNext({
    enrollment: onboarded.enrollment,
    lessonId: 'LES-001',
    scheduleBucket: '20260310-self-next',
    deliveryId: firstDelivery.delivery.delivery_id,
  });

  assert.equal(completion.updated, true);
  assert.equal(completion.nextDelivery.delivered, true);
  assert.equal(completion.nextDelivery.lesson.lesson_id, 'LES-002');

  const duplicateCompletion = progressEngine.completeLesson({
    enrollmentId: onboarded.enrollment.enrollment_id,
    lessonId: 'LES-001',
  });
  assert.equal(duplicateCompletion.updated, false);
})();

console.log('All LMS-023/026/027/028/029/030 smoke tests passed.');
