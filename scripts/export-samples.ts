import { mkdirSync, writeFileSync } from 'node:fs';
import { devicesCsvTemplate, partsCsvTemplate } from '../src/workshop-csv.js';

mkdirSync('public/samples', { recursive: true });
writeFileSync('public/samples/devices.csv', devicesCsvTemplate, 'utf8');
writeFileSync('public/samples/parts.csv', partsCsvTemplate, 'utf8');
console.log('Exported synthetic workshop CSV templates.');
