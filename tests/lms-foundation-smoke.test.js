const assert = require('assert');
const { bootstrapSettings, createConfigService } = require('../src/services/configService');
const { verifySlackRequest } = require('../src/web/requestVerifier');
const { createDoPostHandler } = require('../src/web/doPost');
const { hmacSha256Hex } = require('../src/utils/crypto');

function buildSlackSignature(secret, ts, rawBody) {
  const base = `v0:${ts}:${rawBody}`;
  return `v0=${hmacSha256Hex(secret, base)}`;
}

(function testBootstrapSettings() {
  const result = bootstrapSettings([{ key: 'SLACK_BOT_TOKEN', value: 'x' }]);
  assert.ok(result.rowsToInsert.some((r) => r.key === 'SLACK_SIGNING_SECRET'));
  assert.ok(!result.rowsToInsert.some((r) => r.key === 'SLACK_BOT_TOKEN'));
})();

(function testVerifierHappyPath() {
  const secret = 'secret123';
  const ts = 1710000000;
  const body = 'command=%2Flearn&text=test';
  const sig = buildSlackSignature(secret, ts, body);

  const configService = createConfigService({
    propertyReader: (key) => ({ SLACK_SIGNING_SECRET: secret, WEBHOOK_MAX_SKEW_SECONDS: '300' }[key]),
  });

  const verified = verifySlackRequest({
    headers: {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': sig,
    },
    rawBody: body,
    configService,
    nowEpochSeconds: ts + 10,
  });

  assert.equal(verified.ok, true);
})();

(function testDoPostHandlerRoutesSlashCommand() {
  const secret = 'secret123';
  const ts = Math.floor(Date.now() / 1000);
  const body = 'command=%2Flearn&user_id=U1&text=go';
  const sig = buildSlackSignature(secret, ts, body);

  const handler = createDoPostHandler({
    configEnv: {
      propertyReader: (key) => ({
        SLACK_SIGNING_SECRET: secret,
        WEBHOOK_MAX_SKEW_SECONDS: '300',
      }[key]),
    },
    logger: { warn: () => {} },
  });

  const response = handler({
    headers: {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': sig,
    },
    rawBody: body,
    traceId: 'trace_test_1',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.trace_id, 'trace_test_1');
})();

console.log('All LMS-001/002/003/004/008 smoke tests passed.');
