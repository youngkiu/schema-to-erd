#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const plantumlEncoder = require('plantuml-encoder');
const { schemaToErd } = require('../dist/cjs/index');

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
  const { pumlStr } = await schemaToErd(options.schemaFile, options.outputDir);
  const encoded = plantumlEncoder.encode(pumlStr);
  console.info(`Look at the ERD image - http://www.plantuml.com/plantuml/img/${encoded}`);
})();
