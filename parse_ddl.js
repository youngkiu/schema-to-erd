export function splitDdl(sqlStr) {
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
    // console.log(ddlStr.replace(/(\r\n|\n|\r)/g, '').replace(/\s+/g, ' '));
    ddls.push(ddlStr);
    offset += end;
  }
  return ddls;
}

export function extractTableObj(jsonSchemaDocuments) {
  const tableName = jsonSchemaDocuments.title;
  const columnNames = Object.keys(jsonSchemaDocuments.definitions);
  const primaryKeys = Object.entries(jsonSchemaDocuments.definitions)
    .reduce((acc, [key, val]) => (val.$comment === 'primary key' ? [...acc, key] : acc), []);
  return {
    tableName,
    columnNames,
    primaryKeys,
  };
}
