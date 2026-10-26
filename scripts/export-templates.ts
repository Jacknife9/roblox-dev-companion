import { mkdirSync, writeFileSync } from 'node:fs';
import { templates } from '../src/data/templates';
mkdirSync('templates', { recursive: true });
for (const template of templates) writeFileSync(`templates/${template.id}.luau`, template.code, 'utf8');
console.log(`Exported ${templates.length} Luau templates.`);
