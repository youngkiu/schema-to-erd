[![ESLint](https://github.com/youngkiu/schema-to-erd/actions/workflows/eslint.yml/badge.svg)](https://github.com/youngkiu/schema-to-erd/actions/workflows/eslint.yml)
[![Node.js CI](https://github.com/youngkiu/schema-to-erd/actions/workflows/node.js.yml/badge.svg)](https://github.com/youngkiu/schema-to-erd/actions/workflows/node.js.yml)
[![Node.js Package](https://github.com/youngkiu/schema-to-erd/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/youngkiu/schema-to-erd/actions/workflows/npm-publish.yml)

# schema-to-erd
Generate ERD UML file from Schema DDL file

## Installation

```sh
npm i schema-to-erd
```

## Usage

```js
import { schemaToErd } from 'schema-to-erd';
// or:
const { schemaToErd } = require('schema-to-erd');

schemaToErd('./schema_samples/sakila-schema.sql');
```

### Sample Schema file

1. [Employees Sample Database](https://dev.mysql.com/doc/employee/en/) - https://github.com/datacharmer/test_db
2. [MySQL Sample Database](https://www.mysqltutorial.org/mysql-sample-database.aspx) - https://www.mysqltutorial.org/wp-content/uploads/2018/03/mysqlsampledatabase.zip
3. https://github.com/ronaldbradford/schema

![sakila-schema.puml](puml_examples/sakila-schema.png)
