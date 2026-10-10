import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

// Compare actual private values locally; never print credential contents.
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const forbidden = tracked.filter(path => /(^|\/)(\.env(?!\.example$)|\.vercel\/|test-results\/|node_modules\/|\.prototype-archive\/)/.test(path));
const envText = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
const secrets = [...envText.matchAll(/^(?:NEBIUS_API_KEY|LANGSMITH_API_KEY|VERCEL_OIDC_TOKEN)=(.*)$/gm)]
  .map(match => match[1].trim().replace(/^['"]|['"]$/g, '')).filter(value => value.length > 12);
const walk = path => existsSync(path) ? readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)]) : [];
const files = [...new Set([...tracked, ...walk('dist')])];
const leaked = files.filter(path => {
  if (!existsSync(path)) return false;
  const content = readFileSync(path);
  return secrets.some(secret => content.includes(Buffer.from(secret)));
});
console.log(JSON.stringify({ checkedFiles: files.length, privateValuesChecked: secrets.length, forbiddenTrackedPaths: forbidden, filesContainingPrivateValues: leaked, ok: !forbidden.length && !leaked.length }, null, 2));
if (forbidden.length || leaked.length) process.exitCode = 1;
