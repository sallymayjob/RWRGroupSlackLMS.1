const { createUsersRepo } = require('./usersRepo');
const { createCurriculumRepo } = require('./curriculumRepo');
const { createLearningOpsRepo } = require('./learningOpsRepo');
const { createAdminOpsRepo } = require('./adminOpsRepo');
const { createContentPipelineRepo } = require('./contentPipelineRepo');
const { createAiConfigRepo } = require('./aiConfigRepo');

module.exports = {
  createUsersRepo,
  createCurriculumRepo,
  createLearningOpsRepo,
  createAdminOpsRepo,
  createContentPipelineRepo,
  createAiConfigRepo,
};
