import { Parser } from 'sql-ddl-to-json-schema';
import assert from 'assert';
import _ from 'lodash';
import config from './unparsable_token.json' assert { type: "json" };

const parser = new Parser('mysql');

function _removeUnparsableToken(ddlStr) {
  return Object.keys(config).reduce(
    (acc, unparsableType) => {
      const values = config[unparsableType];
      if (_.isEmpty(values)) {
        return acc;
      }
      switch(unparsableType) {
        case 'token':
          const unparsableTokens = values.join('|');
          const re = new RegExp(`\\s+(${unparsableTokens})\\b`, 'gmi');
          return acc.replace(re, '');
        case 'line':
          return acc;
        case 'statement':
          return acc;
        default:
          assert(false, `Not supported token type: ${unparsableType}`);
          break;
      }
    },
    ddlStr
  );
}

function _splitDdl(sqlStr) {
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
    ddls.push(_removeUnparsableToken(ddlStr));
    offset += end;
  }
  return ddls;
}

function _extractTableObj(jsonSchemaDocuments) {
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

export default (sqlStr) =>
  _splitDdl(sqlStr).reduce(
    (acc, sql) => {
      try {
        const options = { useRef: true };
        const jsonSchemaDocuments = parser.feed(sql).toJsonSchemaArray(options);
        if (jsonSchemaDocuments.length === 0) {
          return acc;
        }
        assert(jsonSchemaDocuments.length === 1, 'Parse only one DDL at a time.');
        const { tableName, columnNames, primaryKeys } = _extractTableObj(jsonSchemaDocuments[0]);
        return { ...acc, [tableName]: { columnNames, primaryKeys } };
      } catch (err) {
        console.error(`Can not parse "${sql}"`, err);
        return acc;
      }
    },
    {},
  );
