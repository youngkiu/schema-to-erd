import { Parser } from 'sql-ddl-to-json-schema';
import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';

const parser = new Parser('mysql');

async function main(schemaFilePath, outputDirPath) {
  const sqlStr = await fs.readFile(schemaFilePath, 'utf8');

  /**
   * Read on for available options.
   */
  const options = { useRef: true };

  /**
   * Feed the parser with the SQL DDL statements...
   */
  parser.feed(sqlStr);

  /**
   * You can get the parsed results in JSON format...
   */
  const parsedJsonFormat = parser.results;

  /**
   * And pass it to be formatted in a compact JSON format...
   */
  const compactJsonTablesArray = parser.toCompactJson(parsedJsonFormat);

  /**
   * Finally pass it to format to an array of JSON Schema items. One for each table...
   */
  const jsonSchemaDocuments = parser.toJsonSchemaArray(options, compactJsonTablesArray);

  console.log(util.inspect(jsonSchemaDocuments, { showHidden: false, depth: null, colors: true }));

  const tables = jsonSchemaDocuments.reduce(
    (previousValue, currentValue) => Object.assign(
      previousValue,
      { [currentValue.title]: Object.keys(currentValue.properties) },
    ),
    {},
  );
  console.log(tables);

  // https://plantuml.com/ko/ie-diagram
  const pumlStr = `@startuml

' hide the spot
hide circle

' avoid problems with angled crows feet
skinparam linetype ortho

entity "Entity01" as e01 {
  *e1_id : number <<generated>>
  --
  *name : text
  description : text
}

entity "Entity02" as e02 {
  *e2_id : number <<generated>>
  --
  *e1_id : number <<FK>>
  other_details : text
}

entity "Entity03" as e03 {
  *e3_id : number <<generated>>
  --
  e1_id : number <<FK>>
  other_details : text
}

e01 ||..o{ e02
e01 |o..o{ e03

@enduml
`;

  const pumlFilePath = path.join(outputDirPath, `${path.parse(schemaFilePath).name}.puml`);
  await fs.mkdir(outputDirPath, { recursive: true });
  await fs.writeFile(pumlFilePath, pumlStr, 'utf8');
}

const schemaFilePath = './sql_samples/sql-ddl-to-json-schema.sql';
const outputDirPath = './output';

main(schemaFilePath, outputDirPath);
