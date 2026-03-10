/** Simple sheet-like adapter for local tests and Apps Script parity design. */

function createInMemorySheetAdapter() {
  const tables = new Map();

  function ensureTable(name, columns = []) {
    if (!tables.has(name)) {
      tables.set(name, { columns: [...columns], rows: [] });
      return;
    }

    const table = tables.get(name);
    if (!table.columns.length && columns.length) {
      table.columns = [...columns];
    }
  }

  function getColumns(name) {
    const table = tables.get(name);
    if (!table) throw new Error(`Table not found: ${name}`);
    return [...table.columns];
  }

  function insert(name, row) {
    const table = tables.get(name);
    if (!table) throw new Error(`Table not found: ${name}`);
    table.rows.push({ ...row });
    return { ...row };
  }

  function update(name, predicate, updater) {
    const table = tables.get(name);
    if (!table) throw new Error(`Table not found: ${name}`);
    let count = 0;
    table.rows = table.rows.map((row) => {
      if (!predicate(row)) return row;
      count += 1;
      return { ...row, ...updater(row) };
    });
    return count;
  }

  function find(name, predicate) {
    const table = tables.get(name);
    if (!table) throw new Error(`Table not found: ${name}`);
    return table.rows.filter(predicate).map((r) => ({ ...r }));
  }

  function all(name) {
    return find(name, () => true);
  }

  return {
    ensureTable,
    getColumns,
    insert,
    update,
    find,
    all,
  };
}
