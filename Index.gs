/**
 * LMS bootstrap registry for Apps Script.
 *
 * All runtime constructors are globally available once files are loaded.
 * This object mirrors the old Node.js module export surface.
 */
var LMS = {
  bootstrapSettings: bootstrapSettings,
  createConfigService: createConfigService,
  createIdempotencyService: createIdempotencyService,
  createNotificationService: createNotificationService,
  verifySlackRequest: verifySlackRequest,
  createDoPostHandler: createDoPostHandler,
  createRouter: createRouter,
  normalizeInboundRequest: normalizeInboundRequest,
  createSlackClient: createSlackClient,
  createDal: createDal,
  createInMemorySheetAdapter: createInMemorySheetAdapter,
  bootstrapTabSchemas: bootstrapTabSchemas,
  TAB_SCHEMAS: TAB_SCHEMAS,
  ENUMS: ENUMS,
  TABLE_RULES: TABLE_RULES,
  validateRow: validateRow,
  createUsersRepo: createUsersRepo,
  createCurriculumRepo: createCurriculumRepo,
  createLearningOpsRepo: createLearningOpsRepo,
  createAdminOpsRepo: createAdminOpsRepo,
  createContentPipelineRepo: createContentPipelineRepo,
  createAiConfigRepo: createAiConfigRepo,
  createGeminiService: createGeminiService,
  createGemInvocationLayer: createGemInvocationLayer,
  createOnboardingEngine: createOnboardingEngine,
  createLessonDeliveryEngine: createLessonDeliveryEngine,
  createProgressEngine: createProgressEngine,
  createQueueProcessor: createQueueProcessor,
  createSchedulerEngine: createSchedulerEngine,
  createDeliveryScanEngine: createDeliveryScanEngine,
  createReminderScanEngine: createReminderScanEngine,
  createReminderEngine: createReminderEngine,
  createContentPipelineEngine: createContentPipelineEngine,
  createContentQAEngine: createContentQAEngine,
  createPublishingSyncEngine: createPublishingSyncEngine,
};
