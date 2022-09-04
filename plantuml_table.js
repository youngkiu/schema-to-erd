function generateEntity(tableName, columns) {
  const columnsStr = columns.join('\n  ');
  return `entity ${tableName} {
  ${columnsStr}
}
`;
}

module.exports = {
  generateEntity,
};
