/** LMS-020 Idempotency utility + lookup helper */

function createIdempotencyService({ learningOpsRepo }) {
  function ensureUniqueDelivery(delivery) {
    const existing = learningOpsRepo.getDeliveryByIdempotencyKey(delivery.idempotency_key);
    if (existing) {
      return { inserted: false, record: existing };
    }

    return { inserted: true, record: learningOpsRepo.createDelivery(delivery) };
  }

  function ensureUniqueReminder(reminder) {
    const existing = learningOpsRepo.getReminderByIdempotencyKey(reminder.idempotency_key);
    if (existing) {
      return { inserted: false, record: existing };
    }

    return { inserted: true, record: learningOpsRepo.createReminder(reminder) };
  }

  return {
    ensureUniqueDelivery,
    ensureUniqueReminder,
  };
}

module.exports = { createIdempotencyService };
