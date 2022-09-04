// import Parser for all databases
const { Parser } = require('node-sql-parser');
const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');
const { splitDdl, extractTableObj } = require('./parse_ddl');
const { generateEntity } = require('./plantuml_table');

const parser = new Parser();

async function main(schemaFilePath, outputDirPath) {
  const sqlStr = await fs.readFile(schemaFilePath, 'utf8');

  const ddls = splitDdl(sqlStr);
  const entities = ddls.reduce(
    (acc, cur) => {
      try {
        const ast = parser.astify(cur); // mysql sql grammer parsed by default
        assert(ast.length === 1, 'Parse only one DDL at a time.');
        const { tableName, columnNames } = extractTableObj(ast[0]);
        return acc + generateEntity(tableName, columnNames);
      } catch (err) {
        console.error(`Can not parse "${cur}"`, err);
        return acc;
      }
    },
    '',
  );

  const relations = '';

  // https://plantuml.com/ko/ie-diagram
  const pumlStr = `@startuml

' hide the spot
hide circle
hide methods
hide stereotypes

' avoid problems with angled crows feet
skinparam linetype ortho

${entities}

${relations}

@enduml
`;

  const pumlFilePath = path.join(outputDirPath, `${path.parse(schemaFilePath).name}.puml`);
  await fs.mkdir(outputDirPath, { recursive: true });
  await fs.writeFile(pumlFilePath, pumlStr, 'utf8');
}

const schemaFilePath = './sql_samples/database_modeling_4.sql';
const outputDirPath = './output';

main(schemaFilePath, outputDirPath);
