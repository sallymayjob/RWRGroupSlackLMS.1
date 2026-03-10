/** LMS-018 Content_Pipeline/Generated_Drafts/QA/Publish repository */

function createContentPipelineRepo(dal) {
  return {
    upsertPipeline(pipeline) {
      return dal.upsert('Content_Pipeline', pipeline, (row) => row.pipeline_id === pipeline.pipeline_id);
    },
    createDraft(draft) {
      return dal.insert('Generated_Drafts', draft);
    },
    createQaResult(result) {
      return dal.insert('QA_Results', result);
    },
    enqueuePublish(publishJob) {
      return dal.insert('Publish_Queue', publishJob);
    },
    listPipelineByStatus(status) {
      return dal.findBy('Content_Pipeline', (row) => row.status === status);
    },
  };
}

module.exports = { createContentPipelineRepo };
