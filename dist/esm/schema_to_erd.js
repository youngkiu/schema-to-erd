var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { promises as fs } from 'fs';
import path from 'path';
import parseDdl from './parse_ddl';
import generatePlantUml from './plantuml_table';
export default function schemaToErd(schemaFilePath, outputDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const sqlStr = yield fs.readFile(schemaFilePath, 'utf8');
        const tableColumns = parseDdl(sqlStr);
        const pumlStr = generatePlantUml(tableColumns);
        const schemaFilePathStr = schemaFilePath.toString();
        const pumlDirPath = (outputDirPath === null || outputDirPath === void 0 ? void 0 : outputDirPath.toString()) || path.parse(schemaFilePathStr).dir;
        const pumlFilePath = path.join(pumlDirPath, `${path.parse(schemaFilePathStr).name}.puml`);
        if (pumlDirPath) {
            yield fs.mkdir(pumlDirPath, { recursive: true });
        }
        yield fs.writeFile(pumlFilePath, pumlStr, 'utf8');
        return { pumlFilePath, pumlStr };
    });
}
//# sourceMappingURL=schema_to_erd.js.map