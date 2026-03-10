/** LMS-040 Reminder scan engine */

function createReminderScanEngine({ reminderEngine, schedulerEngine, now = () => new Date().toISOString() }) {
  function scanAndEnqueue() {
    const overdue = reminderEngine.findOverdueDeliveries(now());
    overdue.forEach((delivery) => {
      schedulerEngine.enqueueJob('SEND_REMINDER', {
        delivery_id: delivery.delivery_id,
        user_id: delivery.user_id,
      });
    });

    return { scanned: overdue.length, queued: overdue.length };
  }

  return { scanAndEnqueue };
}
