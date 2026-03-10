/**
 * LMS-003: Slack request signature + timestamp verification.
 */

const { hmacSha256Hex, secureCompare } = require('../utils/crypto');

function verifySlackRequest({ headers, rawBody, configService, nowEpochSeconds }) {
  const timestampRaw = headers['x-slack-request-timestamp'] || headers['X-Slack-Request-Timestamp'];
  const signatureRaw = headers['x-slack-signature'] || headers['X-Slack-Signature'];

  if (!timestampRaw || !signatureRaw) {
    return { ok: false, reason: 'missing_headers' };
  }

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: 'invalid_timestamp' };
  }

  const skewLimit = Number(configService.get('WEBHOOK_MAX_SKEW_SECONDS') || 300);
  const now = Number.isFinite(nowEpochSeconds)
    ? nowEpochSeconds
    : Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > skewLimit) {
    return { ok: false, reason: 'timestamp_out_of_range' };
  }

  const signingSecret = configService.getSecret('SLACK_SIGNING_SECRET');
  const baseString = `v0:${timestamp}:${rawBody || ''}`;
  const computedSignature = `v0=${hmacSha256Hex(signingSecret, baseString)}`;

  const valid = secureCompare(computedSignature, signatureRaw);
  if (!valid) {
    return { ok: false, reason: 'invalid_signature' };
  }

  return {
    ok: true,
    reason: 'verified',
    timestamp,
  };
}

module.exports = {
  verifySlackRequest,
};
