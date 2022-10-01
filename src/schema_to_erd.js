import { promises as fs } from 'fs';
import path from 'path';
import parseDdl from './parse_ddl.js';
import generatePlantUml from './plantuml_table.js';

export default async function schemaToErd(schemaFilePath, outputDirPath) {
  const sqlStr = await fs.readFile(schemaFilePath, 'utf8');

  const tableColumns = parseDdl(sqlStr);
  const pumlStr = generatePlantUml(tableColumns);

  const pumlDirPath = outputDirPath || path.parse(schemaFilePath).dir;
  const pumlFilePath = path.join(pumlDirPath, `${path.parse(schemaFilePath).name}.puml`);
  if (pumlDirPath) {
    await fs.mkdir(pumlDirPath, { recursive: true });
  }
  await fs.writeFile(pumlFilePath, pumlStr, 'utf8');

  return { pumlFilePath, pumlStr };
}
