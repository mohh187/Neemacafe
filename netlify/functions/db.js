import { neon } from '@netlify/neon';

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL must be defined for database access.');
}

export const sql = neon(connectionString);
