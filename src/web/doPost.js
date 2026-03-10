/**
 * LMS-004: Webhook ingress and ACK strategy.
 *
 * In Apps Script this can be adapted to `function doPost(e) {}`
 * by mapping e.postData.contents and e.parameter headers extraction.
 */

const { createConfigService } = require('../services/configService');
const { verifySlackRequest } = require('./requestVerifier');
const { createRouter, normalizeInboundRequest } = require('./router');
const { handleSlashCommand } = require('../slack/commandHandlers');

function createDoPostHandler({
  configEnv = {},
  logger = console,
} = {}) {
  const configService = createConfigService(configEnv);

  const router = createRouter({
    onSlashCommand: (req, ctx) => handleSlashCommand(req, ctx),
    onInteractive: () => ({ ok: true, status: 200, body: { response_action: 'clear' } }),
    onUrlVerification: (req) => ({ ok: true, status: 200, body: { challenge: req.payload.challenge || '' } }),
    onUnknown: () => ({ ok: false, status: 400, body: { error: 'unknown_route' } }),
  });

  return function handleWebhook({ headers = {}, rawBody = '', traceId = '' }) {
    const requestTraceId = traceId || `trace_${Date.now()}`;

    const verification = verifySlackRequest({
      headers,
      rawBody,
      configService,
    });

    if (!verification.ok) {
      logger.warn('request_rejected', { traceId: requestTraceId, reason: verification.reason });
      return {
        status: 401,
        body: {
          ok: false,
          error: 'unauthorized',
          reason: verification.reason,
          trace_id: requestTraceId,
        },
      };
    }

    const normalized = normalizeInboundRequest({ headers, rawBody });
    const routed = router.route(normalized, { traceId: requestTraceId });

    return {
      status: routed.status || 200,
      body: {
        ok: Boolean(routed.ok),
        trace_id: requestTraceId,
        ...routed.body,
      },
    };
  };
}

module.exports = {
  createDoPostHandler,
};
