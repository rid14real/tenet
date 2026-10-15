// Turn the single-file Vite build into the page fragment the claude.ai Artifact publisher expects
// (title, styles and scripts first, no doctype/html/head/body wrappers of our own).
import { readFileSync, writeFileSync } from 'node:fs';
const [, , input, output] = process.argv;
const html = readFileSync(input, 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/i)[1];
const keep = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .replace(/<title>[\s\S]*?<\/title>/i, '')
  .trim();
writeFileSync(output, `<title>Tenet</title>\n${keep}\n${body.trim()}\n`);
console.log(`wrote ${output} (${(Buffer.byteLength(readFileSync(output)) / 1024).toFixed(0)} KB)`);
