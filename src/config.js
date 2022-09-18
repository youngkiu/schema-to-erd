import fs from 'fs';
import path from 'path';
import * as url from 'url';

const loadConfig = (configFilePath) => {
  return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
};

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const configFilePath = path.join(__dirname, './unparsable_token.json');
const config = loadConfig(configFilePath);

export default config;
