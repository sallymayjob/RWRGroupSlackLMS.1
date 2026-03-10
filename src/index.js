/**
 * LMS bootstrap exports.
 */

const { bootstrapSettings, createConfigService } = require('./services/configService');
const { createIdempotencyService } = require('./services/idempotencyService');
const { createNotificationService } = require('./services/notificationService');
const { verifySlackRequest } = require('./web/requestVerifier');
const { createDoPostHandler } = require('./web/doPost');
const { createRouter, normalizeInboundRequest } = require('./web/router');
const { createSlackClient } = require('./slack/slackClient');
const { createDal } = require('./data/dal');
const { createInMemorySheetAdapter } = require('./data/inMemorySheetAdapter');
const { bootstrapTabSchemas, TAB_SCHEMAS } = require('./data/schema/tabs');
const { ENUMS, TABLE_RULES, validateRow } = require('./data/schema/validators');
const {
  createUsersRepo,
  createCurriculumRepo,
  createLearningOpsRepo,
  createAdminOpsRepo,
  createContentPipelineRepo,
} = require('./data/repositories');
const { createOnboardingEngine } = require('./engines/onboardingEngine');
const { createLessonDeliveryEngine } = require('./engines/lessonDeliveryEngine');
const { createProgressEngine } = require('./engines/progressEngine');
const { createQueueProcessor } = require('./engines/queueProcessor');
const { createSchedulerEngine } = require('./engines/schedulerEngine');
const { createDeliveryScanEngine } = require('./engines/deliveryScanEngine');
const { createReminderScanEngine } = require('./engines/reminderScanEngine');
const { createReminderEngine } = require('./engines/reminderEngine');

module.exports = {
  bootstrapSettings,
  createConfigService,
  createIdempotencyService,
  createNotificationService,
  verifySlackRequest,
  createDoPostHandler,
  createRouter,
  normalizeInboundRequest,
  createSlackClient,
  createDal,
  createInMemorySheetAdapter,
  bootstrapTabSchemas,
  TAB_SCHEMAS,
  ENUMS,
  TABLE_RULES,
  validateRow,
  createUsersRepo,
  createCurriculumRepo,
  createLearningOpsRepo,
  createAdminOpsRepo,
  createContentPipelineRepo,
  createOnboardingEngine,
  createLessonDeliveryEngine,
  createProgressEngine,
  createQueueProcessor,
  createSchedulerEngine,
  createDeliveryScanEngine,
  createReminderScanEngine,
  createReminderEngine,
};
