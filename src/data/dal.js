/**
 * LMS-013: DAL base helpers with validation and typed table access.
 */

const { TAB_SCHEMAS, bootstrapTabSchemas } = require('./schema/tabs');
const { validateRow } = require('./schema/validators');

function createDal(adapter, options = {}) {
  const { now = () => new Date().toISOString() } = options;

  bootstrapTabSchemas(adapter);

  function assertKnownTable(tableName) {
    if (!TAB_SCHEMAS[tableName]) {
      throw new Error(`Unknown table: ${tableName}`);
    }
  }

  function prepareRow(tableName, row) {
    const columns = adapter.getColumns(tableName);
    const timestamped = { ...row };
    if (columns.includes('updated_at') && !timestamped.updated_at) {
      timestamped.updated_at = now();
    }
    validateRow(tableName, timestamped);
    return timestamped;
  }

  function insert(tableName, row) {
    assertKnownTable(tableName);
    const prepared = prepareRow(tableName, row);
    return adapter.insert(tableName, prepared);
  }

  function upsert(tableName, row, predicate) {
    assertKnownTable(tableName);
    const existing = adapter.find(tableName, predicate)[0];
    if (!existing) return insert(tableName, row);

    const merged = prepareRow(tableName, { ...existing, ...row });
    adapter.update(tableName, predicate, () => merged);
    return merged;
  }

  function findBy(tableName, predicate) {
    assertKnownTable(tableName);
    return adapter.find(tableName, predicate);
  }

  function getOne(tableName, predicate) {
    return findBy(tableName, predicate)[0] || null;
  }

  return {
    insert,
    upsert,
    findBy,
    getOne,
    all: (tableName) => adapter.all(tableName),
    bootstrap: () => bootstrapTabSchemas(adapter),
  };
}

module.exports = {
  createDal,
};
