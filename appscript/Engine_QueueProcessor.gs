/** LMS-035/036/037 Queue lifecycle, locking, worker retry/backoff */

function createQueueProcessor({ adminOpsRepo, handlers = {}, config = {}, now = () => new Date() }) {
  const maxAttempts = Number(config.maxAttempts || 3);
  const backoffSeconds = Number(config.backoffSeconds || 60);
  const lockOwner = config.lockOwner || 'worker-1';
  const staleLockSeconds = Number(config.staleLockSeconds || 300);

  function claimNext() {
    const nowDate = now();
    const nowIso = nowDate.toISOString();
    const staleIso = new Date(nowDate.getTime() - (staleLockSeconds * 1000)).toISOString();

    return adminOpsRepo.claimNextJob({
      lockOwner,
      nowIso,
      staleLockCutoffIso: staleIso,
    });
  }

  function runOnce() {
    const job = claimNext();
    if (!job) return { processed: false, reason: 'no_job' };

    const handler = handlers[job.job_type];
    if (!handler) {
      adminOpsRepo.markFailedPermanent(job.job_id, {
        attemptCount: Number(job.attempt_count || 0),
        reason: `No handler for ${job.job_type}`,
      });
      return { processed: true, status: 'failed_permanent', jobId: job.job_id };
    }

    try {
      const payload = job.payload_json ? JSON.parse(job.payload_json) : {};
      const result = handler(payload, job);
      adminOpsRepo.markDone(job.job_id, result || {});
      return { processed: true, status: 'done', jobId: job.job_id };
    } catch (err) {
      const attemptCount = Number(job.attempt_count || 0) + 1;
      if (attemptCount >= maxAttempts) {
        adminOpsRepo.markFailedPermanent(job.job_id, {
          attemptCount,
          reason: err.message,
        });
        return { processed: true, status: 'failed_permanent', jobId: job.job_id };
      }

      const nextAttemptAt = new Date(now().getTime() + (attemptCount * backoffSeconds * 1000)).toISOString();
      adminOpsRepo.markRetry(job.job_id, {
        attemptCount,
        nextAttemptAt,
        reason: err.message,
      });
      return { processed: true, status: 'retry', jobId: job.job_id };
    }
  }

  return {
    claimNext,
    runOnce,
  };
}
