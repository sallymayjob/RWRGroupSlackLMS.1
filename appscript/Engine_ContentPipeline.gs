/** LMS-056 + LMS-057 Content pipeline orchestration */

function createContentPipelineEngine({ contentPipelineRepo, gemInvocationLayer, now = () => new Date().toISOString() }) {
  async function startPipeline({ pipelineId, contentScope, ownerUserId, sourceBrief }) {
    return contentPipelineRepo.upsertPipeline({
      pipeline_id: pipelineId,
      content_scope: contentScope,
      current_stage: 'draft_generation',
      status: 'in_progress',
      owner_user_id: ownerUserId,
      source_brief: sourceBrief,
      updated_at: now(),
    });
  }

  async function generateDrafts({ pipelineId, roles, taskPayload }) {
    const drafts = [];
    for (const roleName of roles) {
      const result = await gemInvocationLayer.invokeRole(roleName, taskPayload);
      const draft = contentPipelineRepo.createDraft({
        draft_id: `DRF-${pipelineId}-${roleName}-${Date.now()}`,
        pipeline_id: pipelineId,
        agent_role: roleName,
        draft_text: result.output.text,
        metadata_json: JSON.stringify(result.output.json || {}),
        created_at: now(),
        status: 'generated',
      });
      drafts.push(draft);
    }

    contentPipelineRepo.upsertPipeline({
      ...contentPipelineRepo.getPipelineById(pipelineId),
      current_stage: 'qa',
      status: 'awaiting_qa',
      updated_at: now(),
    });

    return drafts;
  }

  return { startPipeline, generateDrafts };
}
