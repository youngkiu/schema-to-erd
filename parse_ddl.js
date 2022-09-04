const assert = require('assert');

function splitDdl(sqlStr) {
  const ddls = [];
  const ddlRegExp = /(CREATE|ALTER|DROP|RENAME|TRUNCATE)\sTABLE/i;
  let offset = 0;
  while (offset < sqlStr.length) {
    const restSqlStr = sqlStr.substring(offset, sqlStr.length);
    const start = restSqlStr.search(ddlRegExp);
    if (start === -1) {
      break;
    }
    const end = restSqlStr.indexOf(';', start) + 1;
    const ddlStr = restSqlStr.substring(start, end);
    console.log(ddlStr.replace(/(\r\n|\n|\r)/g, '').replace(/\s+/g, ' '));
    ddls.push(ddlStr);
    offset += end;
  }
  return ddls;
}

function extractTableObj(ast) {
  if (ast.type === 'create' && ast.keyword === 'table') {
    assert(ast.table.length === 1, 'Parse only one DDL at a time.');
    const tableName = ast.table[0].table;
    const columnNames = ast.create_definitions.reduce(
      (acc, cur) => [...acc, cur.column.column],
      [],
    );
    return {
      tableName,
      columnNames,
    };
  }

  throw new Error(`Not supported type(${ast.type}) or keyword(${ast.keyword})`);
}

module.exports = {
  splitDdl,
  extractTableObj,
};
