/** Minimal Slack client adapter for local/test mode. */

function createSlackClient({ postMessageImpl }) {
  return {
    postMessage(payload) {
      if (typeof postMessageImpl === 'function') {
        return postMessageImpl(payload);
      }
      return { ok: true, ts: String(Date.now()), channel: payload.channel };
    },
  };
}

module.exports = { createSlackClient };
