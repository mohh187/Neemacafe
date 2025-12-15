// Dynamic import to avoid build-time dependency issues
let neon;
let sql;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is not set');
}

try {
  const module = await import('@neondatabase/serverless');
  neon = module.neon;
  sql = neon(DATABASE_URL);
} catch (error) {
  console.error('Failed to load @neondatabase/serverless:', error);
  throw error;
}

export { sql };
