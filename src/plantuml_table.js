export function generateEntity(tableName, columnNames, primaryKeys) {
  const columnNamesWithPk = columnNames.map((columnName) => (primaryKeys.includes(columnName) ? `*${columnName}` : columnName));
  const columnsStr = columnNamesWithPk.join('\n  ');
  return `entity ${tableName} {
  ${columnsStr}
}
`;
}

export function generateRelation(tableName, columnNames, primaryKeys, allPKs) {
  const allPkNames = Object.keys(allPKs);
  return columnNames.reduce(
    (acc, columnName) => {
      if (!primaryKeys.includes(columnName) && allPkNames.includes(columnName)) {
        const foreignKey = allPKs[columnName];
        return [...acc, `${tableName}::${columnName} --> ${foreignKey.tableName}::${foreignKey.columnName}`];
      }
      return acc;
    },
    [],
  );
}