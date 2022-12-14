/* package.json
 * {
 *   "type": "module",
 *   "scripts": {
 *     "test": "mocha --timeout 10000 --experimental-specifier-resolution=node"
 *   }
 * }
 */

import { schemaToErd } from '../dist/esm/index';
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';
import assert from 'assert';

const compareFiles = async (filePath1, filePath2) => {
  const isExistsFilePath1 = !!(await fs.stat(filePath1).catch((e) => false));
  const isExistsFilePath2 = !!(await fs.stat(filePath2).catch((e) => false));
  if (isExistsFilePath1 !== isExistsFilePath2) {
    console.error(`Not exist file: ${isExistsFilePath1 ?? isExistsFilePath2}`)
    return false;
  }

  const filePath1Buf = await fs.readFile(filePath1);
  const filePath2Buf = await fs.readFile(filePath2);
  const isEqual = filePath1Buf.equals(filePath2Buf);
  if (isEqual) {
    await fs.unlink(filePath1);
  }
  return isEqual;
};

const fileList = glob.sync('schema_samples/**/*.sql');
console.log(fileList);

describe('samples', () => {
  fileList.map((filePath) => {
    it(path.parse(filePath).base, async () => {
      const { pumlFilePath } = await schemaToErd(filePath);
      const { dir, base } = path.parse(pumlFilePath);
      const pathParts = dir.split(path.sep);
      const expectedFilePath = path.join('./puml_examples', ...pathParts.slice(1), base);
      assert.ok(await compareFiles(pumlFilePath, expectedFilePath));
    });
  });
});
