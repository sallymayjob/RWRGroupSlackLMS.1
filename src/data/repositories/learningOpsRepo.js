/** LMS-016 Enrollments/Progress/Deliveries/Reminders repository */

function createLearningOpsRepo(dal) {
  return {
    upsertEnrollment(enrollment) {
      return dal.upsert('Enrollments', enrollment, (row) => row.enrollment_id === enrollment.enrollment_id);
    },
    getEnrollmentById(enrollmentId) {
      return dal.getOne('Enrollments', (row) => row.enrollment_id === enrollmentId);
    },
    findActiveEnrollments() {
      return dal.findBy('Enrollments', (row) => row.paused_flag !== 'true');
    },
    findUserEnrollmentForTrack(userId, trackId) {
      return dal.getOne('Enrollments', (row) => row.user_id === userId && row.track_id === trackId);
    },
    upsertProgress(progress) {
      return dal.upsert('Progress', progress, (row) => row.progress_id === progress.progress_id);
    },
    getProgressByEnrollmentAndLesson(enrollmentId, lessonId) {
      return dal.getOne('Progress', (row) => row.enrollment_id === enrollmentId && row.lesson_id === lessonId);
    },
    listProgressByEnrollment(enrollmentId) {
      return dal.findBy('Progress', (row) => row.enrollment_id === enrollmentId);
    },
    createDelivery(delivery) {
      return dal.upsert('Deliveries', delivery, (row) => row.delivery_id === delivery.delivery_id);
    },
    listDeliveriesByUserAndLesson(userId, lessonId) {
      return dal.findBy('Deliveries', (row) => row.user_id === userId && row.lesson_id === lessonId);
    },
    findDueDeliveries(referenceIso) {
      return dal.findBy('Deliveries', (row) => row.sent_at && row.sent_at <= referenceIso);
    },
    createReminder(reminder) {
      return dal.upsert('Reminders', reminder, (row) => row.reminder_id === reminder.reminder_id);
    },
    getDeliveryByIdempotencyKey(key) {
      return dal.getOne('Deliveries', (row) => row.idempotency_key === key);
    },
    getReminderByIdempotencyKey(key) {
      return dal.getOne('Reminders', (row) => row.idempotency_key === key);
    },
  };
}

module.exports = { createLearningOpsRepo };
