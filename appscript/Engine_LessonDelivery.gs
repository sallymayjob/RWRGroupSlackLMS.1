/** LMS-027 + LMS-028 Lesson eligibility + delivery engine */

function createLessonDeliveryEngine({ curriculumRepo, learningOpsRepo, idempotencyService, notificationService, idGenerator = {} }) {
  const makeDeliveryId = idGenerator.deliveryId || ((userId, lessonId, bucket) => `DLV-${userId}-${lessonId}-${bucket}`);

  function determineNextEligibleLesson(enrollment) {
    const progressRows = learningOpsRepo.listProgressByEnrollment(enrollment.enrollment_id);
    const completedLessonIds = progressRows
      .filter((row) => row.status === 'completed' || row.status === 'waived')
      .map((row) => row.lesson_id);

    return curriculumRepo.getNextLesson(enrollment.track_id, completedLessonIds);
  }

  function deliverNextLesson({ enrollment, scheduleBucket, channelId = '', traceId = '' }) {
    const lesson = determineNextEligibleLesson(enrollment);
    if (!lesson) {
      return { delivered: false, reason: 'no_eligible_lesson' };
    }

    const idempotencyKey = `${enrollment.user_id}|${lesson.lesson_id}|${scheduleBucket}`;
    const result = idempotencyService.ensureUniqueDelivery({
      delivery_id: makeDeliveryId(enrollment.user_id, lesson.lesson_id, scheduleBucket),
      user_id: enrollment.user_id,
      lesson_id: lesson.lesson_id,
      scheduled_for: scheduleBucket,
      status: 'queued',
      channel_id: channelId,
      idempotency_key: idempotencyKey,
    });

    if (!result.inserted) {
      return { delivered: false, reason: 'duplicate_delivery', delivery: result.record, lesson };
    }

    const notification = notificationService.sendLessonDelivery({
      userId: enrollment.user_id,
      lesson,
      channelId,
      traceId,
    });

    const sentDelivery = learningOpsRepo.createDelivery({
      ...result.record,
      status: 'sent',
      sent_at: notification.sentAt,
      slack_ts: notification.slackTs,
      channel_id: notification.channelId,
    });

    const progressId = `PRG-${enrollment.enrollment_id}-${lesson.lesson_id}`;
    learningOpsRepo.upsertProgress({
      progress_id: progressId,
      enrollment_id: enrollment.enrollment_id,
      lesson_id: lesson.lesson_id,
      status: 'delivered',
      delivered_at: notification.sentAt,
    });

    return { delivered: true, lesson, delivery: sentDelivery };
  }

  return {
    determineNextEligibleLesson,
    deliverNextLesson,
  };
}
