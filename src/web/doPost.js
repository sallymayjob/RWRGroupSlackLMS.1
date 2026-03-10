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
const { createRoleGuard } = require('./roleGuard');
const { createLoggingService } = require('../services/loggingService');

function createDoPostHandler({
  configEnv = {},
  logger = console,
  usersRepo,
  loggingService,
  routerHandlers = {},
} = {}) {
  const configService = createConfigService(configEnv);
  const roleGuard = createRoleGuard({ usersRepo });
  const auditLogger = loggingService || createLoggingService({ logger });

  const router = createRouter({
    onSlashCommand: (req, ctx) => handleSlashCommand(req, ctx),
    onInteractive: () => ({ ok: true, status: 200, body: { response_action: 'clear' } }),
    onUrlVerification: (req) => ({ ok: true, status: 200, body: { challenge: req.payload.challenge || '' } }),
    onUnknown: () => ({ ok: false, status: 400, body: { error: 'unknown_route' } }),
    ...routerHandlers,
  });

  function initializeTraceContext(traceId) {
    return {
      traceId: traceId || `trace_${Date.now()}`,
      actor: null,
      authz: null,
    };
  }

  function verifyRequest({ headers, rawBody }) {
    return verifySlackRequest({
      headers,
      rawBody,
      configService,
    });
  }

  function authorizeRequest(normalizedRequest) {
    return roleGuard.authorize(normalizedRequest);
  }

  return function handleWebhook({ headers = {}, rawBody = '', traceId = '' }) {
    const context = initializeTraceContext(traceId);

    const verification = verifyRequest({ headers, rawBody });
    if (!verification.ok) {
      const authz = {
        allowed: false,
        routeKey: 'request_signature',
        reason: verification.reason,
        requiredRoles: [],
        actorRole: null,
      };
      context.authz = authz;
      auditLogger.logRejectedRequest({
        traceId: context.traceId,
        actor: context.actor,
        authz,
        routeType: 'webhook',
      });
      logger.warn('request_rejected', { traceId: context.traceId, reason: verification.reason });
      return {
        status: 401,
        body: {
          ok: false,
          error: 'unauthorized',
          reason: verification.reason,
          trace_id: context.traceId,
        },
      };
    }

    const normalized = normalizeInboundRequest({ headers, rawBody });
    const authorization = authorizeRequest(normalized);
    context.actor = authorization.actor;
    context.authz = authorization.authz;

    if (!authorization.ok) {
      auditLogger.logRejectedRequest({
        traceId: context.traceId,
        actor: context.actor,
        authz: context.authz,
        routeType: normalized.routeType,
      });
      logger.warn('request_denied', { traceId: context.traceId, authz: context.authz });
      return {
        status: 403,
        body: {
          ok: false,
          error: 'forbidden',
          reason: context.authz.reason,
          trace_id: context.traceId,
        },
      };
    }

    auditLogger.logAcceptedRequest({
      traceId: context.traceId,
      actor: context.actor,
      authz: context.authz,
      routeType: normalized.routeType,
    });

    try {
      const routed = router.route(normalized, context);

      return {
        status: routed.status || 200,
        body: {
          ok: Boolean(routed.ok),
          trace_id: context.traceId,
          ...routed.body,
        },
      };
    } catch (error) {
      auditLogger.logHandlerFailure({
        traceId: context.traceId,
        module: 'web.router',
        error,
        payload: {
          routeType: normalized.routeType,
          actor: context.actor,
          authz: context.authz,
        },
      });
      logger.error('handler_failure', { traceId: context.traceId, error: error.message });
      return {
        status: 500,
        body: {
          ok: false,
          error: 'internal_error',
          trace_id: context.traceId,
        },
      };
    }
  };
}

module.exports = {
  createDoPostHandler,
};
