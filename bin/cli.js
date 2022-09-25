#!/usr/bin/env node
import { program } from 'commander';
import { schemaToErd } from '../dist/main.mjs';
import fs from 'fs';

program
  .requiredOption('-s, --schema-file <sql file path>', 'schema.sql file path')
  .option('-o, --output-dir <output directory path>', 'output directory of uml file');

program.parse();

const options = program.opts();
if (!(fs.existsSync(options.schemaFile))) {
  console.error(`Not exist the schema.sql file(${options.schemaFile})`);
  process.exit(1);
}

(async () => {
  const pumlFilePath = await schemaToErd(options.schemaFile, options.outputDir);
  console.info(`Generate the plantuml file of ${pumlFilePath}`);
})();
