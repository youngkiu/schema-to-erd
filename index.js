import { schemaToErd } from './src/schema_to_erd.js';

const schemaFilePath = './schema_samples/sakila.sql';
const outputDirPath = './output';

schemaToErd(schemaFilePath, outputDirPath);
