/** Simple notification abstraction for LMS-028 */

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
  };
}

module.exports = { createNotificationService };
