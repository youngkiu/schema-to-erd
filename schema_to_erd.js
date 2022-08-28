import { Parser } from 'sql-ddl-to-json-schema';
import util from 'util';

const parser = new Parser('mysql');

const sql = `
CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  nickname VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE MyISAM COMMENT 'All system users';

ALTER TABLE users ADD UNIQUE KEY unq_nick (nickname);
`;

/**
 * Read on for available options.
 */
const options = { useRef: true };

/**
 * Feed the parser with the SQL DDL statements...
 */
parser.feed(sql);

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

const tables = {};
jsonSchemaDocuments.forEach((jsonSchema) => {
  tables[jsonSchema.title] = Object.keys(jsonSchema.properties);
});
console.log(tables);
