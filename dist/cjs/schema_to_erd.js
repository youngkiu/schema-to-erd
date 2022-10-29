"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const parse_ddl_1 = __importDefault(require("./parse_ddl"));
const plantuml_table_1 = __importDefault(require("./plantuml_table"));
function schemaToErd(schemaFilePath, outputDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const sqlStr = yield fs_1.promises.readFile(schemaFilePath, 'utf8');
        const tableColumns = (0, parse_ddl_1.default)(sqlStr);
        const pumlStr = (0, plantuml_table_1.default)(tableColumns);
        const schemaFilePathStr = schemaFilePath.toString();
        const pumlDirPath = (outputDirPath === null || outputDirPath === void 0 ? void 0 : outputDirPath.toString()) || path_1.default.parse(schemaFilePathStr).dir;
        const pumlFilePath = path_1.default.join(pumlDirPath, `${path_1.default.parse(schemaFilePathStr).name}.puml`);
        if (pumlDirPath) {
            yield fs_1.promises.mkdir(pumlDirPath, { recursive: true });
        }
        yield fs_1.promises.writeFile(pumlFilePath, pumlStr, 'utf8');
        return { pumlFilePath, pumlStr };
    });
}
exports.default = schemaToErd;
//# sourceMappingURL=schema_to_erd.js.map