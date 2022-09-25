import { Parser } from 'sql-ddl-to-json-schema';
import assert from 'assert';
import _ from 'lodash';
import config from './unparsable.config.js';

const parser = new Parser('mysql');

function removeFunctionKeyword(sqlStr, functionKeyword) {
  let removalSqlStr = sqlStr;
  let parenthesesDepth;
  let removalStart;
  let removalEnd;

  /* eslint-disable no-constant-condition */
  while (true) {
    removalStart = removalSqlStr.indexOf(functionKeyword);
    if (removalStart === -1) {
      break;
    }

    parenthesesDepth = 0;
    removalEnd = undefined;
    for (let i = removalStart + functionKeyword.length; i < removalSqlStr.length; i += 1) {
      const c = removalSqlStr.charAt(i);
      if (c === '(') {
        parenthesesDepth += 1;
      } else if (c === ')') {
        parenthesesDepth -= 1;
        if (parenthesesDepth === 0) {
          removalEnd = i + 1;
          break;
        }
      }
    }
    assert(removalEnd, `Not detect removal region - ${sqlStr}`);
    removalSqlStr = removalSqlStr.slice(0, removalStart) + removalSqlStr.slice(removalEnd);
  }
  return removalSqlStr;
}

function removeFunctionSql(sqlStr, functionKeywords) {
  return functionKeywords.reduce(
    (acc, functionKeyword) => removeFunctionKeyword(acc, functionKeyword),
    sqlStr,
  );
}

function removeUnparsableToken(ddlStr) {
  return Object.keys(config).reduce(
    (acc, unparsableType) => {
      const values = config[unparsableType];
      if (_.isEmpty(values)) {
        return acc;
      }
      /* eslint-disable no-case-declarations */
      switch (unparsableType) {
        case 'inter-token':
          const interTokenRegExp = new RegExp(`\\s+(${values.join('|')})\\s+`, 'gmi');
          return acc.replace(interTokenRegExp, ' ');
        case 'match-token':
          const matchTokenRegExp = new RegExp(`(${values.join('|')})`, 'gm');
          return acc.replace(matchTokenRegExp, '');
        case 'func-token':
          return removeFunctionSql(acc, values);
        default:
          assert(false, `Not supported token type: ${unparsableType}`);
          break;
      }
      assert(false, 'This can never be reached.');
      return acc;
    },
    ddlStr,
  );
}

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
    const end = restSqlStr.indexOf(';', start);
    if (end === -1) {
      throw new Error(`Not found semicolon(;). Error - ${restSqlStr}`);
    }
    const ddlStr = restSqlStr.substring(start, end + 1);
    ddls.push(removeUnparsableToken(ddlStr).replace(/,[\n\r\s]+\)/gm, '\n)'));
    offset += end;
  }
  return ddls;
}

function extractTableObj(jsonSchemaDocuments) {
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

const removeSqlComments = (sqlStr) => sqlStr
  .replace(/alter\s+table\s+(.*)\s+comment\s+['"](.*?)['"]/gi, '') // https://stackoverflow.com/a/6441056
  .replace(/COMMENT\s+['"](.*?)['"]/gi, '') // https://stackoverflow.com/a/171483
  .replace(/\/\*.*?\*\/|--.*?\n/gs, ''); // https://stackoverflow.com/a/21018155

export default (sqlStr) => splitDdl(removeSqlComments(sqlStr))
  .reduce(
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
        console.error(`Can not parse "${sql}"`);
        return acc;
      }
    },
    {},
  );
