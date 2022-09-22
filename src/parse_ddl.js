import { Parser } from 'sql-ddl-to-json-schema';
import assert from 'assert';
import _ from 'lodash';
import config from './unparsable.config.js';

const parser = new Parser('mysql');

function _removeFunctionKeyword(sqlStr, functionKeyword) {
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
    for (let i = removalStart + functionKeyword.length; i < removalSqlStr.length; i++) {
      let c = removalSqlStr.charAt(i);
      if (c === '(') {
        parenthesesDepth += 1;
      } else if (c === ')') {
        parenthesesDepth -= 1;
        if (parenthesesDepth === 0) {
          removalEnd = i+1;
          break;
        }
      }
    }
    assert(removalEnd, `Not detect removal region - ${sqlStr}`);
    removalSqlStr = removalSqlStr.slice(0, removalStart) + removalSqlStr.slice(removalEnd);
  }
  return removalSqlStr;
}

function _removeFunctionSql(sqlStr, functionKeywords) {
  return functionKeywords.reduce(
    (acc, functionKeyword) => _removeFunctionKeyword(acc, functionKeyword),
    sqlStr
  );
}

function _removeUnparsableToken(ddlStr) {
  return Object.keys(config).reduce(
    (acc, unparsableType) => {
      const values = config[unparsableType];
      if (_.isEmpty(values)) {
        return acc;
      }
      /* eslint-disable no-case-declarations */
      switch(unparsableType) {
        case 'inter-token':
          const interTokenRegExp = new RegExp(`\\s+(${values.join('|')})\\s+`, 'gmi');
          return acc.replace(interTokenRegExp, ' ');
        case 'match-token':
          const matchTokenRegExp = new RegExp(`(${values.join('|')})`, 'gm');
          return acc.replace(matchTokenRegExp, '');
        case 'function':
          return _removeFunctionSql(acc, values);
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
    ddls.push(_removeUnparsableToken(ddlStr).replace(/,[\n\r\s]+\)/gm, '\n)'));
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
  // https://stackoverflow.com/a/21018155
  _splitDdl(sqlStr.replace(/\/\*.*?\*\/|--.*?\n/gs, '')).reduce(
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
    {}
  );
