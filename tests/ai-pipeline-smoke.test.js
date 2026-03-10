const assert = require('assert');
const { createInMemorySheetAdapter } = require('../src/data/inMemorySheetAdapter');
const { createDal } = require('../src/data/dal');
const { createCurriculumRepo, createContentPipelineRepo, createAiConfigRepo } = require('../src/data/repositories');
const { createGeminiService } = require('../src/ai/geminiService');
const { createGemInvocationLayer } = require('../src/ai/gemInvocationLayer');
const { createContentPipelineEngine } = require('../src/engines/contentPipelineEngine');
const { createContentQAEngine } = require('../src/engines/contentQAEngine');
const { createPublishingSyncEngine } = require('../src/engines/publishingSyncEngine');

(async function testAiPipelineChain() {
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter, { now: () => '2026-03-10T00:00:00Z' });

  const curriculumRepo = createCurriculumRepo(dal);
  const contentPipelineRepo = createContentPipelineRepo(dal);
  const aiConfigRepo = createAiConfigRepo(dal);

  aiConfigRepo.upsertGemRole({
    gem_role_id: 'GEM-Content-Agent',
    role_name: 'Content Agent',
    gem_identifier: 'gem-content-agent',
    active_flag: 'true',
  });
  aiConfigRepo.upsertGemRole({
    gem_role_id: 'GEM-QA-Reviewer',
    role_name: 'QA Reviewer',
    gem_identifier: 'gem-qa-reviewer',
    active_flag: 'true',
  });

  aiConfigRepo.upsertPromptConfig({
    prompt_id: 'PRM-Content-Agent-v1',
    role_name: 'Content Agent',
    system_prompt: 'Generate lesson draft JSON with score field.',
    active_flag: 'true',
  });
  aiConfigRepo.upsertPromptConfig({
    prompt_id: 'PRM-QA-Reviewer-v1',
    role_name: 'QA Reviewer',
    system_prompt: 'Review draft and return score.',
    active_flag: 'true',
  });

  const geminiService = createGeminiService({
    transport: {
      async generate(payload) {
        return {
          text: `output for ${payload.metadata.roleName}`,
          json: { score: payload.metadata.roleName === 'QA Reviewer' ? 90 : 85 },
          usage: { input_tokens: 10, output_tokens: 20 },
        };
      },
    },
  });

  const gemInvocationLayer = createGemInvocationLayer({
    geminiService,
    gemRolesRepo: aiConfigRepo,
    promptConfigsRepo: aiConfigRepo,
  });

  const contentPipelineEngine = createContentPipelineEngine({
    contentPipelineRepo,
    gemInvocationLayer,
    now: () => '2026-03-10T01:00:00Z',
  });

  await contentPipelineEngine.startPipeline({
    pipelineId: 'CP-1',
    contentScope: 'lesson:LES-1',
    ownerUserId: 'USR-1',
    sourceBrief: 'Intro lesson brief',
  });

  const drafts = await contentPipelineEngine.generateDrafts({
    pipelineId: 'CP-1',
    roles: ['Content Agent'],
    taskPayload: { lesson_id: 'LES-1', objective: 'Understand LMS' },
  });
  assert.equal(drafts.length, 1);

  const qaEngine = createContentQAEngine({
    contentPipelineRepo,
    gemInvocationLayer,
    now: () => '2026-03-10T01:30:00Z',
  });

  const qaResults = await qaEngine.runQaForDraft({
    draft: drafts[0],
    qaRoles: ['QA Reviewer'],
  });
  const qaSummary = qaEngine.summarizeQa(qaResults);
  assert.equal(qaSummary.passed, true);

  curriculumRepo.upsertLesson({ lesson_id: 'LES-1', track_id: 'TRK-1', sequence_no: 1, title: 'Intro' });
  contentPipelineRepo.enqueuePublish({
    publish_id: 'PUB-1',
    content_id: 'LC-LES-1-v1',
    target_lesson_id: 'LES-1',
    status: 'approved',
    content_markdown: '# Lesson 1',
    assignment_text: 'Do task',
    media_links_json: '[]',
  });

  const publishEngine = createPublishingSyncEngine({
    contentPipelineRepo,
    curriculumRepo,
    now: () => '2026-03-10T02:00:00Z',
  });

  const publishResult = publishEngine.publishApprovedContent();
  assert.equal(publishResult.publishedCount, 1);
})();

console.log('All LMS-054/055/056/057/058/059 smoke tests passed.');
