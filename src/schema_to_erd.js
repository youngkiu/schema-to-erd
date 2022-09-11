import { Parser } from 'sql-ddl-to-json-schema';
import { promises as fs } from 'fs';
import path from 'path';
import assert from 'assert';
import { splitDdl, extractTableObj } from './parse_ddl.js';
import { generateEntity, generateRelation } from './plantuml_table.js';

const parser = new Parser('mysql');

export async function schemaToErd(schemaFilePath, outputDirPath) {
  const sqlStr = await fs.readFile(schemaFilePath, 'utf8');

  const ddls = splitDdl(sqlStr);
  const tableColumns = ddls.reduce(
    (acc, sql) => {
      try {
        const options = { useRef: true };
        const jsonSchemaDocuments = parser.feed(sql).toJsonSchemaArray(options);
        if (jsonSchemaDocuments.length === 0) {
          return acc;
        }
        assert(jsonSchemaDocuments.length === 1, 'Parse only one DDL at a time.');
        const { tableName, columnNames, primaryKeys } = extractTableObj(jsonSchemaDocuments[0]);
        return { ...acc, [tableName]: { columnNames, primaryKeys } };
      } catch (err) {
        console.error(`Can not parse "${sql}"`, err);
        return acc;
      }
    },
    {},
  );
  const entities = Object.entries(tableColumns)
    .reduce(
      (acc, [tableName, { columnNames, primaryKeys }]) => (
        acc + generateEntity(tableName, columnNames, primaryKeys)
      ),
      '',
    );
  const allPKs = Object.entries(tableColumns)
    .reduce(
      (acc, [tableName, { primaryKeys }]) => {
        if (primaryKeys.length !== 1) {
          return acc;
        }

        const primaryKey = primaryKeys[0];
        const primaryKeyName = primaryKey.startsWith(tableName) ? primaryKey : `${tableName}_${primaryKey}`;
        const foreignKey = { tableName, columnName: primaryKey };
        return { ...acc, [primaryKeyName]: foreignKey };
      },
      {},
    );
  const relations = Object.entries(tableColumns)
    .reduce(
      (acc, [tableName, { columnNames, primaryKeys }]) => [
        ...acc, ...generateRelation(tableName, columnNames, primaryKeys, allPKs),
      ],
      [],
    );

  // https://plantuml.com/ko/ie-diagram
  const pumlStr = `@startuml

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

  const pumlFilePath = path.join(outputDirPath, `${path.parse(schemaFilePath).name}.puml`);
  await fs.mkdir(outputDirPath, { recursive: true });
  await fs.writeFile(pumlFilePath, pumlStr, 'utf8');
}
