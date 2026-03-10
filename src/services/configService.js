/**
 * LMS-002: Settings bootstrap + secure key loading utility.
 *
 * This service is runtime-agnostic:
 * - In Apps Script, provide env.sheetReader and env.propertyReader implementations.
 * - In tests/local Node, pass plain objects.
 */

const REQUIRED_KEYS = [
  'SLACK_SIGNING_SECRET',
  'SLACK_BOT_TOKEN',
  'WEBHOOK_MAX_SKEW_SECONDS',
  'APP_ENV',
];

const DEFAULT_SETTINGS = {
  WEBHOOK_MAX_SKEW_SECONDS: '300',
  APP_ENV: 'prod',
};

function bootstrapSettings(existingRows = []) {
  const byKey = new Map(existingRows.map((row) => [row.key, row]));
  const now = new Date().toISOString();

  const rowsToInsert = [];
  for (const key of REQUIRED_KEYS) {
    if (!byKey.has(key)) {
      rowsToInsert.push({
        key,
        value: DEFAULT_SETTINGS[key] || '',
        scope: 'global',
        updated_at: now,
      });
    }
  }

  return {
    requiredKeys: [...REQUIRED_KEYS],
    defaults: { ...DEFAULT_SETTINGS },
    rowsToInsert,
  };
}

function createConfigService(env = {}) {
  const cache = new Map();

  const readFromSources = (key) => {
    if (typeof env.propertyReader === 'function') {
      const propValue = env.propertyReader(key);
      if (propValue !== undefined && propValue !== null && propValue !== '') {
        return String(propValue);
      }
    }

    if (typeof env.sheetReader === 'function') {
      const sheetValue = env.sheetReader(key);
      if (sheetValue !== undefined && sheetValue !== null && sheetValue !== '') {
        return String(sheetValue);
      }
    }

    if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
      return DEFAULT_SETTINGS[key];
    }

    return undefined;
  };

  const get = (key, options = {}) => {
    const { required = false, useCache = true } = options;

    if (useCache && cache.has(key)) {
      return cache.get(key);
    }

    const value = readFromSources(key);

    if (required && (value === undefined || value === '')) {
      throw new Error(`Missing required setting: ${key}`);
    }

    if (useCache && value !== undefined) {
      cache.set(key, value);
    }

    return value;
  };

  const getSecret = (key) => {
    const value = get(key, { required: true });
    return value;
  };

  const flushCache = () => cache.clear();

  return {
    get,
    getSecret,
    flushCache,
    constants: {
      REQUIRED_KEYS,
      DEFAULT_SETTINGS,
    },
  };
}

module.exports = {
  bootstrapSettings,
  createConfigService,
  REQUIRED_KEYS,
  DEFAULT_SETTINGS,
};
