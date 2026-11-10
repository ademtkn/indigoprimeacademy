// Builds the site into ./docs (GitHub Pages serves main /docs).
// Usage: node src/build.mjs
// The pages themselves come from src/site.mjs; the admin panel runs the same generator in the browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'docs');
const readJson = (f, fallback) => {
  const p = path.join(ROOT, 'content', `${f}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback;
};
const content = Object.fromEntries(['site', 'en', 'ky', 'ru', 'staff', 'news', 'pages'].map((f) => [f, readJson(f)]));
content.editors = readJson('editors', { vault: null, users: [] }); // written by the admin panel
const out = generate({ content, exists: (p) => fs.existsSync(path.join(ROOT, p)) });

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
fs.cpSync(path.join(ROOT, 'admin'), path.join(DIST, 'admin'), { recursive: true }); // the admin panel
fs.mkdirSync(path.join(DIST, 'admin', 'lib'), { recursive: true }); // generator copy for the panel
for (const f of ['site.mjs', 'icons.mjs']) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(DIST, 'admin', 'lib', f));
for (const [rel, text] of Object.entries(out)) {
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), text);
}
console.log(`Built ${out.count} pages in 3 languages → docs/`);
