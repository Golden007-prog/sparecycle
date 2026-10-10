// Run only after the account owner authorizes credential creation and storage.
// Values are passed through stdin, never command-line arguments or output.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
if (!existsSync('.env.local')) throw new Error('Create the private .env.local file first.');
process.loadEnvFile('.env.local');
const keys = ['NEBIUS_API_KEY', 'NEBIUS_MODEL', 'LANGSMITH_API_KEY', 'LANGSMITH_PROJECT', 'LANGSMITH_TRACING', 'LANGSMITH_WORKSPACE_ID'];
const values = keys.map(key => process.env[key]).filter(Boolean);
for (const key of keys) {
  const value = process.env[key]?.trim();
  if (!value) continue;
  const args = ['env', 'add', key, 'production', '--yes', '--force', key.endsWith('API_KEY') ? '--sensitive' : '--no-sensitive'];
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'vercel.cmd ' + args.join(' ')], { input: value, encoding: 'utf8', windowsHide: true })
    : spawnSync('vercel', args, { input: value, encoding: 'utf8' });
  if (result.status !== 0) {
    let safe = String(result.stderr || result.error?.message || 'Configuration failed.');
    for (const secret of values) safe = safe.split(secret).join('[redacted]');
    console.error(`${key}: failed. ${safe.slice(0, 700)}`);
    process.exit(1);
  }
  console.log(`${key}: stored in production settings`);
}
