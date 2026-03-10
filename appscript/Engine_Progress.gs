/** LMS-029 + LMS-030 Completion handling + progress state machine */

function createProgressEngine({ learningOpsRepo, lessonDeliveryEngine }) {
  function completeLesson({ enrollmentId, lessonId, deliveryId = '', score = '', checkinNotes = '' }) {
    const progressId = `PRG-${enrollmentId}-${lessonId}`;
    const existing = learningOpsRepo.getProgressByEnrollmentAndLesson(enrollmentId, lessonId);

    if (existing && existing.status === 'completed') {
      return { updated: false, reason: 'already_completed', progress: existing };
    }

    const completedAt = new Date().toISOString();
    const progress = learningOpsRepo.upsertProgress({
      progress_id: progressId,
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: completedAt,
      score,
      checkin_notes: checkinNotes,
      source_delivery_id: deliveryId,
    });

    return { updated: true, progress };
  }

  function completeAndResolveNext({ enrollment, lessonId, scheduleBucket, deliveryId = '' }) {
    const completion = completeLesson({
      enrollmentId: enrollment.enrollment_id,
      lessonId,
      deliveryId,
    });

    if (!completion.updated) {
      return { ...completion, nextDelivery: null };
    }

    if (enrollment.pace_mode === 'self') {
      const nextDelivery = lessonDeliveryEngine.deliverNextLesson({
        enrollment,
        scheduleBucket,
      });
      return { ...completion, nextDelivery };
    }

    return { ...completion, nextDelivery: null };
  }

  return {
    completeLesson,
    completeAndResolveNext,
  };
}
