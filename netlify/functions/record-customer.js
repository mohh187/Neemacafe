import { sql } from './db.js';
import { addCORS, okJSON } from './_util.js';

function getClientIp(req) {
  const headers = [
    'x-nf-client-connection-ip',
    'x-forwarded-for',
    'client-ip',
    'x-real-ip'
  ];
  for (const key of headers) {
    const value = req.headers.get(key);
    if (value) {
      return value.split(',')[0].trim();
    }
  }
  return '';
}

function sanitizeString(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function sanitizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    const res = new Response('', { status: 204 });
    addCORS(res);
    return res;
  }

  if (req.method !== 'POST') {
    const res = okJSON({ error: 'method' }, 405);
    addCORS(res);
    return res;
  }

  let body = {};
  try {
    body = await req.json();
  } catch (err) {
    const res = okJSON({ error: 'invalid_json' }, 400);
    addCORS(res);
    return res;
  }

  const name = sanitizeString(body.name);
  const phone = sanitizeString(body.phone);
  if (!phone) {
    const res = okJSON({ error: 'phone_required' }, 400);
    addCORS(res);
    return res;
  }

  const lastOrderValue = sanitizeNumber(body.last_order_value, 0);
  const deviceType = sanitizeString(body.device_type);
  const providedIp = sanitizeString(body.ip_address);
  const ipAddress = providedIp || sanitizeString(getClientIp(req));

  try {
    const [row] = await sql`
      INSERT INTO customers (
        customer_key, name, phone, total_orders, total_spent,
        total_drinks, total_rewards, last_order_at, last_device,
        last_user_agent, last_ip, last_order_value, device_type,
        ip_address
      )
      VALUES (
        ${phone}, NULLIF(${name}, ''), NULLIF(${phone}, ''), 1, ${lastOrderValue},
        0, 0, now(), NULLIF(${deviceType}, ''), NULL, NULLIF(${ipAddress}, ''), ${lastOrderValue},
        NULLIF(${deviceType}, ''), NULLIF(${ipAddress}, '')
      )
      ON CONFLICT (customer_key) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, customers.name),
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        total_orders = customers.total_orders + 1,
        total_spent = customers.total_spent + EXCLUDED.total_spent,
        last_order_value = EXCLUDED.last_order_value,
        last_device = COALESCE(EXCLUDED.last_device, customers.last_device),
        device_type = COALESCE(EXCLUDED.device_type, customers.device_type),
        last_user_agent = COALESCE(EXCLUDED.last_user_agent, customers.last_user_agent),
        ip_address = COALESCE(EXCLUDED.ip_address, customers.ip_address),
        last_ip = COALESCE(EXCLUDED.last_ip, customers.last_ip),
        last_order_at = now(),
        updated_at = now()
      RETURNING *`;

    const res = okJSON({ success: true, customer: row });
    addCORS(res);
    return res;
  } catch (err) {
    console.error('Error saving customer', err);
    const res = okJSON({ error: 'database_error' }, 500);
    addCORS(res);
    return res;
  }
};
