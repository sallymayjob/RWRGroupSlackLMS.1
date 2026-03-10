/** LMS-018 + LMS-056/057/058/059 Content pipeline repository */

function createContentPipelineRepo(dal) {
  return {
    upsertPipeline(pipeline) {
      return dal.upsert('Content_Pipeline', pipeline, (row) => row.pipeline_id === pipeline.pipeline_id);
    },
    getPipelineById(pipelineId) {
      return dal.getOne('Content_Pipeline', (row) => row.pipeline_id === pipelineId);
    },
    createDraft(draft) {
      return dal.insert('Generated_Drafts', draft);
    },
    listDraftsByPipeline(pipelineId) {
      return dal.findBy('Generated_Drafts', (row) => row.pipeline_id === pipelineId);
    },
    createQaResult(result) {
      return dal.insert('QA_Results', result);
    },
    listQaResultsByDraft(draftId) {
      return dal.findBy('QA_Results', (row) => row.draft_id === draftId);
    },
    enqueuePublish(publishJob) {
      return dal.insert('Publish_Queue', publishJob);
    },
    listPendingPublishJobs() {
      return dal.findBy('Publish_Queue', (row) => row.status === 'approved' || row.status === 'pending');
    },
    markPublishJobStatus(publishId, status, extra = {}) {
      return dal.upsert('Publish_Queue', {
        ...dal.getOne('Publish_Queue', (row) => row.publish_id === publishId),
        status,
        ...extra,
      }, (row) => row.publish_id === publishId);
    },
    listPipelineByStatus(status) {
      return dal.findBy('Content_Pipeline', (row) => row.status === status);
    },
  };
}

module.exports = { createContentPipelineRepo };
