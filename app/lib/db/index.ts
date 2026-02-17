/**
 * Drizzle ORM Client
 *
 * Singleton database client for type-safe queries.
 * Uses the `postgres` driver connected to Supabase PostgreSQL.
 *
 * Usage:
 * ```ts
 * import { db } from '@/app/lib/db';
 * import { alignments } from '@/app/lib/db/schema';
 * import { eq } from 'drizzle-orm';
 *
 * const result = await db.select().from(alignments).where(eq(alignments.id, id));
 * ```
 *
 * Note: This client bypasses RLS. Use for server-side operations only.
 * For client-side and RLS-protected queries, continue using Supabase client.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing DATABASE_URL environment variable. ' +
      'Set it to your Supabase PostgreSQL connection string: ' +
      'postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres'
    );
  }
  return url;
}

// Create postgres.js connection (singleton)
// Using connection pooling mode (port 6543) for serverless compatibility
const connectionString = getDatabaseUrl();
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase Transaction/Session pooler
  max: 10,
});

// Create Drizzle instance with schema for relational queries
export const db = drizzle(client, { schema });

// Re-export schema for convenience
export * from './schema';
