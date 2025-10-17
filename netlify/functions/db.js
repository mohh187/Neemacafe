import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '';

if (!connectionString) {
  throw new Error(
    'Missing DATABASE_URL (or NETLIFY_DATABASE_URL) env var for Neon connection.'
  );
}

export const sql = neon(connectionString);

export async function dbHealth() {
  try {
    const [row] = await sql`select 1 as ok`;
    return row?.ok === 1;
  } catch {
    return false;
  }
}
import { neon } from '@netlify/neon';

export const sql = neon();
