/**
 * LMS-008: Base request router.
 */

function parseFormEncoded(rawBody = '') {
  return Object.fromEntries(new URLSearchParams(rawBody));
}

function normalizeInboundRequest({ headers = {}, rawBody = '' }) {
  const payload = parseFormEncoded(rawBody);

  if (payload.payload) {
    try {
      const interactive = JSON.parse(payload.payload);
      return {
        routeType: interactive.type || 'interactive',
        payload: interactive,
        raw: payload,
      };
    } catch (err) {
      return {
        routeType: 'parse_error',
        payload: { error: err.message },
        raw: payload,
      };
    }
  }

  if (payload.command) {
    return {
      routeType: 'slash_command',
      payload,
      raw: payload,
    };
  }

  if (payload.type === 'url_verification') {
    return {
      routeType: 'url_verification',
      payload,
      raw: payload,
    };
  }

  return {
    routeType: 'unknown',
    payload,
    raw: payload,
  };
}

function createRouter(handlers = {}) {
  const {
    onSlashCommand,
    onInteractive,
    onUrlVerification,
    onUnknown,
  } = handlers;

  return {
    route(normalizedRequest, context) {
      switch (normalizedRequest.routeType) {
        case 'slash_command':
          return onSlashCommand
            ? onSlashCommand(normalizedRequest, context)
            : { ok: false, status: 404, body: { error: 'slash_command_not_supported' } };
        case 'block_actions':
        case 'view_submission':
        case 'shortcut':
        case 'interactive':
          return onInteractive
            ? onInteractive(normalizedRequest, context)
            : { ok: false, status: 404, body: { error: 'interactive_not_supported' } };
        case 'url_verification':
          return onUrlVerification
            ? onUrlVerification(normalizedRequest, context)
            : { ok: true, status: 200, body: { challenge: normalizedRequest.payload.challenge || '' } };
        default:
          return onUnknown
            ? onUnknown(normalizedRequest, context)
            : { ok: false, status: 400, body: { error: 'unknown_route' } };
      }
    },
  };
}
