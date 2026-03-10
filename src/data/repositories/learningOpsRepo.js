/** LMS-016 Enrollments/Progress/Deliveries/Reminders repository */

function createLearningOpsRepo(dal) {
  return {
    upsertEnrollment(enrollment) {
      return dal.upsert('Enrollments', enrollment, (row) => row.enrollment_id === enrollment.enrollment_id);
    },
    upsertProgress(progress) {
      return dal.upsert('Progress', progress, (row) => row.progress_id === progress.progress_id);
    },
    createDelivery(delivery) {
      return dal.insert('Deliveries', delivery);
    },
    createReminder(reminder) {
      return dal.insert('Reminders', reminder);
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
