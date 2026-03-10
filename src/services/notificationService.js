/** Notification abstraction for delivery + reminder flows. */

function createNotificationService({ slackClient, now = () => new Date().toISOString() }) {
  return {
    sendLessonDelivery({ userId, lesson, channelId = '', traceId = '' }) {
      const text = `Lesson ${lesson.sequence_no}: ${lesson.title}`;
      const response = slackClient.postMessage({
        channel: channelId || userId,
        text,
        metadata: { traceId, lessonId: lesson.lesson_id },
      });

      return {
        sentAt: now(),
        slackTs: response.ts,
        channelId: response.channel,
      };
    },
    sendReminder({ userId, delivery, reminderNo }) {
      const text = `Reminder ${reminderNo}: Lesson ${delivery.lesson_id} is still pending.`;
      const response = slackClient.postMessage({
        channel: userId,
        text,
        metadata: { deliveryId: delivery.delivery_id, reminderNo },
      });

      return {
        sentAt: now(),
        slackTs: response.ts,
        channelId: response.channel,
      };
    },
  };
}

module.exports = { createNotificationService };
