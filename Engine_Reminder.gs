/** LMS-041 Reminder engine */

function createReminderEngine({ learningOpsRepo, idempotencyService, notificationService, now = () => new Date().toISOString() }) {
  function findOverdueDeliveries(referenceIso = now()) {
    return learningOpsRepo.findDueDeliveries(referenceIso)
      .filter((d) => d.status === 'sent' || d.status === 'acknowledged');
  }

  function sendReminderForDelivery(delivery, reminderNo = 1) {
    const idempotencyKey = `${delivery.delivery_id}|${reminderNo}`;
    const reminder = idempotencyService.ensureUniqueReminder({
      reminder_id: `RMD-${delivery.delivery_id}-${reminderNo}`,
      delivery_id: delivery.delivery_id,
      reminder_no: String(reminderNo),
      scheduled_for: now(),
      status: 'queued',
      escalation_target_user_id: delivery.user_id,
      idempotency_key: idempotencyKey,
    });

    if (!reminder.inserted) {
      return { sent: false, reason: 'duplicate_reminder', reminder: reminder.record };
    }

    const msg = notificationService.sendReminder({
      userId: delivery.user_id,
      delivery,
      reminderNo,
    });

    const sentRecord = learningOpsRepo.createReminder({
      ...reminder.record,
      status: 'sent',
      sent_at: msg.sentAt,
    });

    return { sent: true, reminder: sentRecord };
  }

  return {
    findOverdueDeliveries,
    sendReminderForDelivery,
  };
}
