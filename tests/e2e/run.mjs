// Runs the end-to-end journey against a local Supabase stack.
// Starts Supabase, resets it to the checked-in migrations, reads its local
// keys without printing them, then hands off to Playwright.
// Usage: npm run test:e2e

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function supabase(args) {
  // Output is captured, not inherited: `supabase start` prints the local keys.
  const result = spawnSync('npx', ['supabase', ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`supabase ${args[0]} failed (exit ${result.status}).`);
    console.error((result.stderr || '').split('\n').slice(-15).join('\n'));
    process.exit(1);
  }
  return result.stdout;
}

supabase(['start']);
supabase(['db', 'reset', '--yes']);

const env = Object.fromEntries(
  supabase(['status', '-o', 'env'])
    .split('\n')
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2]])
);

const required = ['API_URL', 'ANON_KEY', 'SERVICE_ROLE_KEY'];
const missing = required.filter((key) => !env[key]);
if (missing.length) {
  console.error(`supabase status is missing: ${missing.join(', ')}`);
  process.exit(1);
}

const result = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY,
    // Per-run value. Invite tokens are encrypted with it; no test data depends on it.
    INVITE_TOKEN_SECRET: randomBytes(32).toString('hex'),
    NEXT_PUBLIC_APP_URL: 'http://localhost:3100',
    // Empty on purpose: a developer's real keys must never send mail from a test run.
    RESEND_API_KEY: '',
    OPS_ALERT_EMAIL: '',
    // Placeholder key for the model stub. The stub never sends it anywhere.
    OPEN_ROUTER_API_KEY: 'e2e-stub-key',
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --require ${path.join(root, 'tests/e2e/support/openrouter-stub.cjs')}`.trim(),
    E2E_SUPABASE_URL: env.API_URL,
    E2E_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY,
  },
});

process.exit(result.status ?? 1);
