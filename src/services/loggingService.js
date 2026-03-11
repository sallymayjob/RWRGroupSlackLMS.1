function createLoggingService({
  dal,
  logger = console,
  now = () => new Date().toISOString(),
  idFactory = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
} = {}) {
  function writeAudit(row) {
    if (dal && dal.insert) {
      return dal.insert('Audit_Log', row);
    }
    logger.info && logger.info('audit_log', row);
    return row;
  }

  function writeError(row) {
    if (dal && dal.insert) {
      return dal.insert('Error_Log', row);
    }
    logger.error && logger.error('error_log', row);
    return row;
  }

  function logAcceptedRequest({ traceId, actor, authz, routeType }) {
    return writeAudit({
      audit_id: idFactory('audit'),
      trace_id: traceId,
      actor: actor ? actor.userId || actor.slackUserId || actor.role : 'unknown',
      action: 'request.accepted',
      entity_type: routeType,
      entity_id: authz.routeKey,
      before_json: '',
      after_json: JSON.stringify({ authz }),
      created_at: now(),
    });
  }

  function logRejectedRequest({ traceId, actor, authz, routeType }) {
    return writeAudit({
      audit_id: idFactory('audit'),
      trace_id: traceId,
      actor: actor ? actor.userId || actor.slackUserId || actor.role : 'unknown',
      action: 'request.rejected',
      entity_type: routeType,
      entity_id: authz.routeKey || 'unknown',
      before_json: '',
      after_json: JSON.stringify({ authz }),
      created_at: now(),
    });
  }

  function logHandlerFailure({ traceId, module = 'web.doPost', severity = 'error', error, payload }) {
    return writeError({
      error_id: idFactory('error'),
      trace_id: traceId,
      module,
      severity,
      error_message: error && error.message ? error.message : String(error),
      payload_json: JSON.stringify(payload || {}),
      retryable: 'false',
      created_at: now(),
    });
  }

  return {
    logAcceptedRequest,
    logRejectedRequest,
    logHandlerFailure,
  };
}

module.exports = {
  createLoggingService,
};
