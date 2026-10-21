import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'Anil Anuragee – AI-Native Full Stack Engineer.html');
const targetImagePath = path.join(rootDir, 'apps', 'web', 'public', 'images', 'anil-anuragee-full-stack-developer.jpg');

const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/src="data:image\/jpeg;base64,([^"]+)"/i) || html.match(/src="data:image\/png;base64,([^"]+)"/i);

if (!match) {
  throw new Error('No embedded base64 image found in the HTML source.');
}

const buffer = Buffer.from(match[1], 'base64');
fs.mkdirSync(path.dirname(targetImagePath), { recursive: true });
fs.writeFileSync(targetImagePath, buffer);
console.log(`Extracted image to: ${targetImagePath}`);
