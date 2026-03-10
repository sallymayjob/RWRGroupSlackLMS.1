const assert = require('assert');
const { createInMemorySheetAdapter } = require('../src/data/inMemorySheetAdapter');
const { bootstrapTabSchemas, TAB_SCHEMAS } = require('../src/data/schema/tabs');
const { createDal } = require('../src/data/dal');
const {
  createUsersRepo,
  createCurriculumRepo,
  createLearningOpsRepo,
  createAdminOpsRepo,
  createContentPipelineRepo,
} = require('../src/data/repositories');
const { createIdempotencyService } = require('../src/services/idempotencyService');

(function testSchemaBootstrap() {
  const adapter = createInMemorySheetAdapter();
  const created = bootstrapTabSchemas(adapter);
  assert.equal(created.length, Object.keys(TAB_SCHEMAS).length);
  assert.deepEqual(adapter.getColumns('Users').slice(0, 4), ['user_id', 'slack_user_id', 'email', 'full_name']);
})();

(function testDalAndRepos() {
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter, { now: () => '2026-03-10T00:00:00Z' });

  const usersRepo = createUsersRepo(dal);
  const curriculumRepo = createCurriculumRepo(dal);
  const learningOpsRepo = createLearningOpsRepo(dal);
  const adminOpsRepo = createAdminOpsRepo(dal);
  const contentPipelineRepo = createContentPipelineRepo(dal);

  usersRepo.upsertUser({
    user_id: 'USR-main-U1',
    slack_user_id: 'U1',
    email: 'u1@example.com',
    full_name: 'User One',
    role: 'learner',
    status: 'active',
  });

  curriculumRepo.upsertTrack({ track_id: 'TRK-lms-101', title: 'LMS 101', active_flag: 'true' });
  curriculumRepo.upsertLesson({ lesson_id: 'LES-TRK-lms-101-001', track_id: 'TRK-lms-101', sequence_no: 1, title: 'Intro' });

  learningOpsRepo.upsertEnrollment({
    enrollment_id: 'ENR-USR-main-U1-TRK-lms-101',
    user_id: 'USR-main-U1',
    track_id: 'TRK-lms-101',
    pace_mode: 'scheduled',
  });

  learningOpsRepo.upsertProgress({
    progress_id: 'PRG-1',
    enrollment_id: 'ENR-USR-main-U1-TRK-lms-101',
    lesson_id: 'LES-TRK-lms-101-001',
    status: 'delivered',
  });

  adminOpsRepo.enqueue({ job_id: 'JOB-1', job_type: 'DELIVERY_SCAN', status: 'pending' });

  contentPipelineRepo.upsertPipeline({ pipeline_id: 'CP-1', content_scope: 'lesson:LES-TRK-lms-101-001', current_stage: 'draft', status: 'in_progress' });

  assert.equal(usersRepo.getBySlackUserId('U1').email, 'u1@example.com');
  assert.equal(curriculumRepo.listLessonsByTrack('TRK-lms-101').length, 1);
  assert.equal(adminOpsRepo.findPendingJobs().length, 1);
  assert.equal(contentPipelineRepo.listPipelineByStatus('in_progress').length, 1);
})();

(function testIdempotencyService() {
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter, { now: () => '2026-03-10T00:00:00Z' });
  const learningOpsRepo = createLearningOpsRepo(dal);
  const idempotencyService = createIdempotencyService({ learningOpsRepo });

  const payload = {
    delivery_id: 'DLV-1',
    user_id: 'USR-main-U1',
    lesson_id: 'LES-TRK-lms-101-001',
    status: 'queued',
    idempotency_key: 'U1|L1|20260310',
  };

  const first = idempotencyService.ensureUniqueDelivery(payload);
  const second = idempotencyService.ensureUniqueDelivery(payload);

  assert.equal(first.inserted, true);
  assert.equal(second.inserted, false);
  assert.equal(dal.all('Deliveries').length, 1);
})();

console.log('All LMS-011/012/013/014-018/020 smoke tests passed.');
