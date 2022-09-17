import { schemaToErd } from '../src/schema_to_erd.js';
import { promises as fs } from 'fs';
import path from "path";
import assert from 'assert';

describe('samples', () => {
  it('sakila-schema.sql', async () => {
    const pumlFilePath = await schemaToErd('./schema_samples/sakila-schema.sql');
    const pumlFileBuf = await fs.readFile(pumlFilePath);
    const expectedFilePath = path.join('./puml_examples', path.parse(pumlFilePath).base);
    const expectedBuf = await fs.readFile(expectedFilePath);
    assert.ok(pumlFileBuf.equals(expectedBuf));
    await fs.unlink(pumlFilePath);
  });
});
