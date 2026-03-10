/** LMS-017 + LMS-035/036/037/038 Queue/Approvals/Admin_Actions repository */

function createAdminOpsRepo(dal, options = {}) {
  const now = options.now || (() => new Date().toISOString());

  return {
    enqueue(job) {
      return dal.insert('Queue', {
        attempt_count: 0,
        ...job,
        updated_at: job.updated_at || now(),
      });
    },
    upsertApproval(approval) {
      return dal.upsert('Approvals', approval, (row) => row.approval_id === approval.approval_id);
    },
    logAdminAction(action) {
      return dal.insert('Admin_Actions', action);
    },
    getJobById(jobId) {
      return dal.getOne('Queue', (row) => row.job_id === jobId);
    },
    findPendingJobs(atIso = now()) {
      return dal.findBy('Queue', (row) => (
        (row.status === 'pending' || row.status === 'retry')
        && (!row.next_attempt_at || row.next_attempt_at <= atIso)
      ));
    },
    claimNextJob({ lockOwner, nowIso = now(), staleLockCutoffIso = nowIso }) {
      const candidates = this.findPendingJobs(nowIso)
        .filter((row) => !row.lock_owner || (row.locked_at && row.locked_at < staleLockCutoffIso))
        .sort((a, b) => String(a.job_id).localeCompare(String(b.job_id)));

      const next = candidates[0];
      if (!next) return null;

      return dal.upsert('Queue', {
        ...next,
        status: 'in_progress',
        lock_owner: lockOwner,
        locked_at: nowIso,
        updated_at: nowIso,
      }, (row) => row.job_id === next.job_id);
    },
    markDone(jobId, result = {}) {
      return dal.upsert('Queue', {
        ...this.getJobById(jobId),
        status: 'done',
        result_json: JSON.stringify(result),
        lock_owner: '',
        locked_at: '',
        updated_at: now(),
      }, (row) => row.job_id === jobId);
    },
    markRetry(jobId, { nextAttemptAt, attemptCount, reason }) {
      return dal.upsert('Queue', {
        ...this.getJobById(jobId),
        status: 'retry',
        attempt_count: attemptCount,
        next_attempt_at: nextAttemptAt,
        error_message: reason,
        lock_owner: '',
        locked_at: '',
        updated_at: now(),
      }, (row) => row.job_id === jobId);
    },
    markFailedPermanent(jobId, { attemptCount, reason }) {
      return dal.upsert('Queue', {
        ...this.getJobById(jobId),
        status: 'failed_permanent',
        attempt_count: attemptCount,
        error_message: reason,
        lock_owner: '',
        locked_at: '',
        updated_at: now(),
      }, (row) => row.job_id === jobId);
    },
  };
}
