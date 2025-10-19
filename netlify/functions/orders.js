import { sql } from './db.js';
import { addCORS, okJSON, unauthorized, authOk } from './_util.js';
import { ensureOrderEnhancements } from './_migrations.js';

export default async (req) => {
  await ensureOrderEnhancements();

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
    const customer = body.customer && typeof body.customer === 'string'
      ? JSON.parse(body.customer)
      : (body.customer || {});
    const [row] = await sql`
      INSERT INTO orders (order_code, table_no, cart, total, customer)
      VALUES (
        ${body.order_code||''},
        ${body.table_no||''},
        ${sql.json(body.cart||[])},
        ${body.total||0},
        ${sql.json(customer)}
      )
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
