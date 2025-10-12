import { sql } from './db.js';
import { addCORS, okJSON, unauthorized, authOk } from './_util.js';

export default async (req) => {
  if (req.method === 'OPTIONS') {
    const res = new Response('', { status: 204 });
    addCORS(res);
    return res;
  }

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 200`;
    const r = okJSON(rows);
    addCORS(r);
    return r;
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const [row] = await sql`
      INSERT INTO orders (table_no, cart, total)
      VALUES (${body.table_no||''}, ${sql.json(body.cart||[])}, ${body.total||0})
      RETURNING *`;
    const r = okJSON(row, 201);
    addCORS(r);
    return r;
  }

  if (!authOk(req)) {
    const r = unauthorized();
    addCORS(r);
    return r;
  }

  const r = okJSON({ error: 'method' }, 405);
  addCORS(r);
  return r;
};
