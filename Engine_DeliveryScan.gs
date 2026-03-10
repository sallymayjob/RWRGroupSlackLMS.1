/** LMS-039 Delivery scan engine */

function createDeliveryScanEngine({ learningOpsRepo, schedulerEngine, now = () => new Date().toISOString() }) {
  function scanAndEnqueue() {
    const due = learningOpsRepo.findActiveEnrollments();
    const queued = due.map((enrollment) => schedulerEngine.enqueueJob('DELIVER_NEXT_LESSON', {
      enrollment_id: enrollment.enrollment_id,
      user_id: enrollment.user_id,
      schedule_bucket: now().slice(0, 10).replace(/-/g, ''),
    }));

    return { scanned: due.length, queued: queued.length };
  }

  return { scanAndEnqueue };
}
