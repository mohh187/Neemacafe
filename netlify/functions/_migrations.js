import { sql } from './db.js';

let ensured = false;

export async function ensureOrderEnhancements() {
  if (ensured) return;
  ensured = true;
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code text DEFAULT ''`;
  } catch (err) {
    console.error('Failed to ensure order_code column', err);
  }
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer jsonb DEFAULT '{}'::jsonb`;
  } catch (err) {
    console.error('Failed to ensure customer column', err);
  }
}
