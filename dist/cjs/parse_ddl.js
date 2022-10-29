"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sql_ddl_to_json_schema_1 = require("sql-ddl-to-json-schema");
const assert_1 = __importDefault(require("assert"));
const unparsable_config_1 = __importDefault(require("./unparsable.config"));
const parser = new sql_ddl_to_json_schema_1.Parser('mysql');
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
            }
            else if (c === ')') {
                parenthesesDepth -= 1;
                if (parenthesesDepth === 0) {
                    removalEnd = i + 1;
                    break;
                }
            }
        }
        (0, assert_1.default)(removalEnd, `Not detect removal region - ${sqlStr}`);
        removalSqlStr = removalSqlStr.slice(0, removalStart) + removalSqlStr.slice(removalEnd);
    }
    return removalSqlStr;
}
function removeFunctionSql(sqlStr, functionKeywords) {
    return functionKeywords.reduce((acc, functionKeyword) => removeFunctionKeyword(acc, functionKeyword), sqlStr);
}
function removeUnparsableToken(ddlStr) {
    return Object.entries(unparsable_config_1.default).reduce((acc, [key, value]) => {
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
                    (0, assert_1.default)(false, `Not supported token type: ${key}`);
                    break;
            }
            (0, assert_1.default)(false, 'This can never be reached.');
            return acc;
        }
        return acc;
    }, ddlStr);
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
    const { title: tableName, definitions } = jsonSchemaDocuments;
    if (tableName === undefined || definitions === undefined) {
        return undefined;
    }
    const columnNames = Object.keys(definitions);
    const primaryKeys = Object.entries(definitions)
        .reduce((acc, [key, val]) => {
        if (typeof val === 'boolean') {
            return acc;
        }
        return (val.$comment === 'primary key' ? [...acc, key] : acc);
    }, []);
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
exports.default = (sqlStr) => splitDdl(removeSqlComments(sqlStr))
    .reduce((acc, sql) => {
    try {
        const options = { useRef: true };
        const jsonSchemaDocuments = parser.feed(sql).toJsonSchemaArray(options);
        if (jsonSchemaDocuments.length === 0) {
            return acc;
        }
        (0, assert_1.default)(jsonSchemaDocuments.length === 1, 'Parse only one DDL at a time.');
        const tableObj = extractTableObj(jsonSchemaDocuments[0]);
        if (tableObj === undefined) {
            return acc;
        }
        const { tableName, columnNames, primaryKeys } = tableObj;
        return Object.assign(Object.assign({}, acc), { [tableName]: { columnNames, primaryKeys } });
    }
    catch (err) {
        throw Error(`Can not parse "${sql}"`);
    }
}, {});
//# sourceMappingURL=parse_ddl.js.map