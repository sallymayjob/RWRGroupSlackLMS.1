/** LMS-038 Scheduler engine */

function createSchedulerEngine({ adminOpsRepo, idGenerator = {}, now = () => new Date().toISOString() }) {
  const makeJobId = idGenerator.jobId || ((type) => `JOB-${type}-${Date.now()}`);

  function enqueueJob(jobType, payload = {}, whenIso = now()) {
    return adminOpsRepo.enqueue({
      job_id: makeJobId(jobType),
      job_type: jobType,
      payload_json: JSON.stringify(payload),
      status: 'pending',
      next_attempt_at: whenIso,
      trace_id: payload.trace_id || '',
    });
  }

  function enqueueDeliveryScan(nowIso = now()) {
    return enqueueJob('DELIVERY_SCAN', { scan_at: nowIso }, nowIso);
  }

  function enqueueReminderScan(nowIso = now()) {
    return enqueueJob('REMINDER_SCAN', { scan_at: nowIso }, nowIso);
  }

  return {
    enqueueJob,
    enqueueDeliveryScan,
    enqueueReminderScan,
  };
}

module.exports = { createSchedulerEngine };
