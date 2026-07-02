/**
 * Bootstrap script: grant a user admin access.
 *
 * There is no UI, migration, or seed script anywhere in this repo that ever
 * sets profiles.is_admin = true (see app/admin/layout.tsx's checkAdminAccess,
 * which gates every /admin/* route behind that flag). This script is
 * currently the only automated way to promote a user to admin -- before it
 * existed, the only path was a manual UPDATE via the Supabase SQL editor.
 *
 * Run once to bootstrap the first admin:
 *   npx tsx scripts/set-admin.ts you@example.com
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be
 * available in the environment. If a .env.local file exists in the project
 * root, this script will load values from it for any variable not already
 * set in the environment (it does not overwrite variables you've already
 * exported). Credentials are always read from process.env -- never hardcode
 * them here.
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads KEY=value pairs from .env.local into process.env, without
 * overwriting anything already set. Intentionally minimal (no external
 * dependency) -- just enough to make `npx tsx scripts/set-admin.ts` work
 * without requiring the caller to manually export every var first.
 */
function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, 'utf-8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main(): Promise<void> {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx scripts/set-admin.ts <email>');
    process.exitCode = 1;
    return;
  }

  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Set them in your shell environment, or in .env.local at the project root, before running this script.'
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find the auth user by email. The admin API has no server-side email
  // filter, so page through users (service-role only, never exposed to the
  // client) until we find a match.
  let matchedUserId: string | null = null;
  let page = 1;
  const perPage = 200;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.error(`Failed to list users: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    const found = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
    );

    if (found) {
      matchedUserId = found.id;
      break;
    }

    if (data.users.length < perPage) break; // No more pages
    page += 1;
  }

  if (!matchedUserId) {
    console.error(
      `No auth user found with email "${email}". They must sign up first, then re-run this script.`
    );
    process.exitCode = 1;
    return;
  }

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', matchedUserId)
    .select('id, display_name, is_admin')
    .single();

  if (updateError || !profile) {
    console.error(`Failed to set is_admin = true: ${updateError?.message ?? 'unknown error'}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Success: ${email} (${profile.display_name ?? profile.id}) now has is_admin = true and can access /admin.`
  );
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
