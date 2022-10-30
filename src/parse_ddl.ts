import { Parser } from 'sql-ddl-to-json-schema';
import assert from 'assert';
import { JSONSchema7 } from 'json-schema';
import config from './unparsable.config';
import { parseDdlType } from './index.d';

const parser = new Parser('mysql');

function removeFunctionKeyword(sqlStr: string, functionKeyword: string): string {
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

function removeFunctionSql(sqlStr: string, functionKeywords: string[]): string {
  return functionKeywords.reduce(
    (acc, functionKeyword) => removeFunctionKeyword(acc, functionKeyword),
    sqlStr,
  );
}

function removeUnparsableToken(ddlStr: string): string {
  return Object.entries(config).reduce(
    (acc, [key, value]) => {
      if (typeof value !== 'undefined' && value.length > 0) {
        /* eslint-disable no-case-declarations */
        switch (key) {
          case 'inter-token':
            const interTokenRegExp = new RegExp(`\\s+(${value.join('|')})\\s+`, 'gmi');
            return acc.replace(interTokenRegExp, ' ');
          case 'match-token':
            const matchTokenRegExp = new RegExp(`(${value.join('|')})`, 'gm');
            return acc.replace(matchTokenRegExp, '');
          case 'func-token':
            return removeFunctionSql(acc, value);
          default:
            assert(false, `Not supported token type: ${key}`);
            break;
        }
        assert(false, 'This can never be reached.');
        return acc;
      }
      return acc;
    },
    ddlStr,
  );
}

function splitDdl(sqlStr: string): string[] {
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

function extractTableObj(
  jsonSchemaDocuments: JSONSchema7,
): {
  primaryKeys: string[];
  columnNames: string[];
  tableName: string
} | undefined {
  const { title: tableName, definitions } = jsonSchemaDocuments;
  if (tableName === undefined || definitions === undefined) {
    return undefined;
  }
  const columnNames = Object.keys(definitions);
  const primaryKeys = Object.entries(definitions)
    .reduce<string[]>(
      (acc, [key, val]) => {
        if (typeof val === 'boolean') {
          return acc;
        }
        return (val.$comment === 'primary key' ? [...acc, key] : acc);
      },
      [],
    );

  return {
    tableName,
    columnNames,
    primaryKeys,
  };
}

const removeSqlComments = (sqlStr: string): string => sqlStr
  .replace(/alter\s+table\s+(.*)\s+comment\s+['"](.*?)['"]/gi, '') // https://stackoverflow.com/a/6441056
  .replace(/COMMENT\s+['"](.*?)['"]/gi, '') // https://stackoverflow.com/a/171483
  .replace(/\/\*.*?\*\/|--.*?\n/gs, ''); // https://stackoverflow.com/a/21018155

export default (sqlStr: string): parseDdlType => splitDdl(removeSqlComments(sqlStr))
  .reduce(
    (acc, sql) => {
      try {
        const options = { useRef: true };
        const jsonSchemaDocuments = parser.feed(sql).toJsonSchemaArray(options);
        if (jsonSchemaDocuments.length === 0) {
          return acc;
        }
        assert(jsonSchemaDocuments.length === 1, 'Parse only one DDL at a time.');
        const tableObj = extractTableObj(jsonSchemaDocuments[0]);
        if (tableObj === undefined) {
          return acc;
        }
        const { tableName, columnNames, primaryKeys } = tableObj;
        return { ...acc, [tableName]: { columnNames, primaryKeys } };
      } catch (err) {
        throw Error(`Can not parse "${sql}"`);
      }
    },
    {},
  );
