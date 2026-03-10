/** LMS-059 Publishing sync engine */

function createPublishingSyncEngine({ contentPipelineRepo, curriculumRepo, now = () => new Date().toISOString() }) {
  function publishApprovedContent() {
    const jobs = contentPipelineRepo.listPendingPublishJobs()
      .filter((j) => j.status === 'approved');

    const published = [];
    for (const job of jobs) {
      const content = curriculumRepo.upsertLessonContent({
        content_id: job.content_id,
        lesson_id: job.target_lesson_id,
        version: job.version || '1',
        content_markdown: job.content_markdown || '',
        assignment_text: job.assignment_text || '',
        media_links_json: job.media_links_json || '[]',
        published_flag: 'true',
        published_at: now(),
      });

      contentPipelineRepo.markPublishJobStatus(job.publish_id, 'published', {
        published_at: now(),
      });

      published.push({ job, content });
    }

    return { publishedCount: published.length, published };
  }

  return { publishApprovedContent };
}

module.exports = { createPublishingSyncEngine };
