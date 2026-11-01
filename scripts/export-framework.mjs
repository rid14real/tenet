// Write the published framework files from the catalogue in @tenet/core (build core first).
// framework/oppf.json is the machine-readable release; framework/OPPF.md is the readable one.
import { writeFileSync } from 'node:fs';
import { frameworkJson, frameworkMarkdown } from '../packages/core/dist/index.js';

writeFileSync(new URL('../framework/oppf.json', import.meta.url), JSON.stringify(frameworkJson(), null, 2) + '\n');
writeFileSync(new URL('../framework/OPPF.md', import.meta.url), frameworkMarkdown() + '\n');
console.log('wrote framework/oppf.json and framework/OPPF.md');
