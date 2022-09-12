import { schemaToErd } from '../src/schema_to_erd.js';
import { promises as fs } from 'fs';
import path from "path";
import assert from 'assert';

describe('samples', () => {
  it('sakila.sql', async () => {
    const schemaFilePath = './schema_samples/sakila.sql';
    const resultDirPath = './test';
    const resultFilePath = await schemaToErd(schemaFilePath, resultDirPath);
    const resultBuf = await fs.readFile(resultFilePath);
    const expectedDirPath = './output';
    const expectedFilePath = path.join(expectedDirPath, path.parse(resultFilePath).base);
    const expectedBuf = await fs.readFile(expectedFilePath);
    assert.ok(resultBuf.equals(expectedBuf));
    await fs.unlink(resultFilePath);
  });
});
