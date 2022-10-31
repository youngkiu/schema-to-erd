import { promises as fs } from 'fs';
import path from 'path';
import { PathLike } from 'node:fs';
import parseDdl from './parse_ddl';
import generatePlantUml from './plantuml_table';
import { parseDdlType, pumlOutputType } from './types';

export default async function schemaToErd(
  schemaFilePath: PathLike,
  outputDirPath?: PathLike,
): Promise<pumlOutputType> {
  const sqlStr = await fs.readFile(schemaFilePath, 'utf8');

  const tableColumns: parseDdlType = parseDdl(sqlStr);
  const pumlStr = generatePlantUml(tableColumns);

  const schemaFilePathStr = schemaFilePath.toString();
  const pumlDirPath = outputDirPath?.toString() || path.parse(schemaFilePathStr).dir;
  const pumlFilePath = path.join(pumlDirPath, `${path.parse(schemaFilePathStr).name}.puml`);
  if (pumlDirPath) {
    await fs.mkdir(pumlDirPath, { recursive: true });
  }
  await fs.writeFile(pumlFilePath, pumlStr, 'utf8');

  return { pumlFilePath, pumlStr };
}
