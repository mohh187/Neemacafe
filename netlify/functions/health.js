import { addCORS, okJSON } from './_util.js';
import { dbHealth, sql } from './db.js';

export default async () => {
  const healthy = await dbHealth();
  let now = null;

  try {
    const [row] = await sql`select now()`;
    now = row?.now ?? null;
  } catch (e) {
    console.warn('health now() failed', e);
  }

  const response = okJSON({ ok: healthy, now });
  addCORS(response);
  return response;
};
