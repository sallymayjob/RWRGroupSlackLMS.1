/** LMS-058 Content QA engine */

function createContentQAEngine({ contentPipelineRepo, gemInvocationLayer, now = () => new Date().toISOString() }) {
  async function runQaForDraft({ draft, qaRoles = [] }) {
    const results = [];
    for (const roleName of qaRoles) {
      const qa = await gemInvocationLayer.invokeRole(roleName, {
        draft_text: draft.draft_text,
        metadata_json: draft.metadata_json,
      });

      const score = Number((qa.output.json && qa.output.json.score) || 0);
      const passFlag = score >= 70 ? 'true' : 'false';

      const row = contentPipelineRepo.createQaResult({
        qa_result_id: `QAR-${draft.draft_id}-${roleName}`,
        draft_id: draft.draft_id,
        qa_agent_role: roleName,
        score: String(score),
        pass_flag: passFlag,
        findings_json: JSON.stringify(qa.output.json || {}),
        created_at: now(),
      });
      results.push(row);
    }

    return results;
  }

  function summarizeQa(results) {
    const passCount = results.filter((r) => r.pass_flag === 'true').length;
    return {
      passCount,
      total: results.length,
      passed: passCount === results.length,
    };
  }

  return { runQaForDraft, summarizeQa };
}

module.exports = { createContentQAEngine };
