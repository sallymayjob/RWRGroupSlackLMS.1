/**
 * LMS-001 bootstrap exports.
 */

const { bootstrapSettings, createConfigService } = require('./services/configService');
const { verifySlackRequest } = require('./web/requestVerifier');
const { createDoPostHandler } = require('./web/doPost');
const { createRouter, normalizeInboundRequest } = require('./web/router');

module.exports = {
  bootstrapSettings,
  createConfigService,
  verifySlackRequest,
  createDoPostHandler,
  createRouter,
  normalizeInboundRequest,
};
