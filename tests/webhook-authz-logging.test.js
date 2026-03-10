const assert = require('assert');
const { hmacSha256Hex } = require('../src/utils/crypto');
const { createDoPostHandler } = require('../src/web/doPost');
const { createInMemorySheetAdapter } = require('../src/data/inMemorySheetAdapter');
const { createDal } = require('../src/data/dal');
const { createUsersRepo } = require('../src/data/repositories/usersRepo');
const { createLoggingService } = require('../src/services/loggingService');

function buildSlackSignature(secret, ts, rawBody) {
  return `v0=${hmacSha256Hex(secret, `v0:${ts}:${rawBody}`)}`;
}

function setup() {
  const secret = 'secret123';
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter);
  const usersRepo = createUsersRepo(dal);
  const loggingService = createLoggingService({
    dal,
    now: () => '2025-01-01T00:00:00.000Z',
    idFactory: (prefix) => `${prefix}_fixed`,
  });

  const handler = createDoPostHandler({
    configEnv: {
      propertyReader: (key) => ({
        SLACK_SIGNING_SECRET: secret,
        WEBHOOK_MAX_SKEW_SECONDS: '300',
      }[key]),
    },
    usersRepo,
    loggingService,
    logger: { warn: () => {}, error: () => {} },
  });

  return { handler, dal, usersRepo, secret };
}

(function testAuthorizedAdminRouteSucceeds() {
  const { handler, usersRepo, secret } = setup();
  usersRepo.upsertUser({
    user_id: 'user_admin',
    slack_user_id: 'UADMIN',
    role: 'admin',
    status: 'active',
  });

  const ts = Math.floor(Date.now() / 1000);
  const body = 'command=%2Fadmin&user_id=UADMIN&text=run';
  const sig = buildSlackSignature(secret, ts, body);

  const response = handler({
    headers: {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': sig,
    },
    rawBody: body,
    traceId: 'trace_admin_ok',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
})();

(function testUnauthorizedRouteDenied() {
  const { handler, usersRepo } = setup();
  usersRepo.upsertUser({
    user_id: 'user_learner',
    slack_user_id: 'ULEARNER',
    role: 'learner',
    status: 'active',
  });

  const ts = Math.floor(Date.now() / 1000);
  const body = 'command=%2Fadmin&user_id=ULEARNER&text=run';
  const sig = buildSlackSignature('secret123', ts, body);

  const response = handler({
    headers: {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': sig,
    },
    rawBody: body,
    traceId: 'trace_admin_denied',
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.error, 'forbidden');
})();

(function testTraceIdPropagatedToHandlerAndLogs() {
  const { handler, usersRepo, dal, secret } = setup();
  usersRepo.upsertUser({
    user_id: 'user_admin_2',
    slack_user_id: 'UADMIN2',
    role: 'admin',
    status: 'active',
  });

  const ts = Math.floor(Date.now() / 1000);
  const body = 'command=%2Fadmin&user_id=UADMIN2&text=run';
  const sig = buildSlackSignature(secret, ts, body);

  const traceId = 'trace_propagation';
  const response = handler({
    headers: {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': sig,
    },
    rawBody: body,
    traceId,
  });

  assert.equal(response.status, 200);
  assert.match(response.body.text, /trace: trace_propagation/);

  const auditRows = dal.all('Audit_Log');
  assert.ok(auditRows.some((row) => row.trace_id === traceId && row.action === 'request.accepted'));
})();


(function testHandlerFailureLoggedToErrorLog() {
  const secret = 'secret123';
  const adapter = createInMemorySheetAdapter();
  const dal = createDal(adapter);
  const usersRepo = createUsersRepo(dal);
  usersRepo.upsertUser({
    user_id: 'user_admin_3',
    slack_user_id: 'UADMIN3',
    role: 'admin',
    status: 'active',
  });

  const loggingService = createLoggingService({
    dal,
    now: () => '2025-01-01T00:00:00.000Z',
    idFactory: (prefix) => `${prefix}_fixed`,
  });

  const handler = createDoPostHandler({
    configEnv: {
      propertyReader: (key) => ({
        SLACK_SIGNING_SECRET: secret,
        WEBHOOK_MAX_SKEW_SECONDS: '300',
      }[key]),
    },
    usersRepo,
    loggingService,
    routerHandlers: {
      onSlashCommand: () => { throw new Error('boom'); },
    },
    logger: { warn: () => {}, error: () => {} },
  });

  const ts = Math.floor(Date.now() / 1000);
  const body = 'command=%2Fadmin&user_id=UADMIN3&text=run';
  const sig = buildSlackSignature(secret, ts, body);

  const response = handler({
    headers: {
      'x-slack-request-timestamp': String(ts),
      'x-slack-signature': sig,
    },
    rawBody: body,
    traceId: 'trace_handler_fail',
  });

  assert.equal(response.status, 500);
  const errorRows = dal.all('Error_Log');
  assert.ok(errorRows.some((row) => row.trace_id === 'trace_handler_fail' && row.module === 'web.router'));
})();

console.log('Webhook middleware authz/logging tests passed.');
