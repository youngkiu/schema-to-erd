[![ESLint](https://github.com/youngkiu/schema-to-erd/actions/workflows/eslint.yml/badge.svg)](https://github.com/youngkiu/schema-to-erd/actions/workflows/eslint.yml)

# schema-to-erd
Generate ERD UML file from Schema DDL file

## Installation

```sh
npm install schema-to-erd
```

## Usage

```js
import { schemaToErd } from 'schema-to-erd';
// or:
const { schemaToErd } = require('schema-to-erd');

const schemaFilePath = './schema_samples/sakila.sql';
const outputDirPath = './output';

schemaToErd(schemaFilePath, outputDirPath);
```

### Sample Schema file

1. [Employees Sample Database](https://dev.mysql.com/doc/employee/en/) - https://github.com/datacharmer/test_db
2. [MySQL Sample Database](https://www.mysqltutorial.org/mysql-sample-database.aspx) - https://www.mysqltutorial.org/wp-content/uploads/2018/03/mysqlsampledatabase.zip
3. https://github.com/ronaldbradford/schema

![sakila.puml](output/sakila.png)
