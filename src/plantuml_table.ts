import { parseDdlType } from './index.d';

function generateEntity(
  tableName: string,
  columnNames: string[],
  primaryKeys: string[],
): string {
  const columnNamesWithPk = columnNames.map(
    (columnName) => (primaryKeys.includes(columnName) ? `*${columnName}` : columnName),
  );
  const columnsStr = columnNamesWithPk.join('\n  ');
  return `entity ${tableName} {
  ${columnsStr}
}
`;
}

type pkObjType = {
  [primaryKeyName: string]: {
    [tableName: string]: string,
    columnName: string,
  }
};

function generateRelation(
  tableName: string,
  columnNames: string[],
  primaryKeys: string[],
  allPKs: pkObjType,
): string[] {
  const allPkNames = Object.keys(allPKs);
  return columnNames.reduce<string[]>(
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

export default function generatePlantUml(tableColumns: parseDdlType): string {
  const entities: string = Object.entries(tableColumns).reduce(
    (acc, [tableName, { columnNames, primaryKeys }]) => (
      acc + generateEntity(tableName, columnNames, primaryKeys)
    ),
    '',
  );
  const allPKs: pkObjType = Object.entries(tableColumns).reduce(
    (accTable, [tableName, { primaryKeys }]) => primaryKeys.reduce(
      (accPk, primaryKey) => {
        const primaryKeyName = primaryKey.startsWith(tableName) ? primaryKey : `${tableName}_${primaryKey}`;
        const foreignKey = { tableName, columnName: primaryKey };
        return { ...accPk, [primaryKeyName]: foreignKey };
      },
      accTable,
    ),
    {},
  );
  const relations: string[] = Object.entries(tableColumns).reduce<string[]>(
    (acc, [tableName, { columnNames, primaryKeys }]) => [
      ...acc, ...generateRelation(tableName, columnNames, primaryKeys, allPKs),
    ],
    [],
  );

  // https://plantuml.com/ko/ie-diagram
  return `@startuml

' hide the spot
hide circle
hide methods
hide stereotypes

' avoid problems with angled crows feet
skinparam linetype ortho

${entities}

${relations.join('\n')}

@enduml
`;
}
