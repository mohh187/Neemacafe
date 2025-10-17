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

function sanitizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCustomerKey(phone) {
  const digits = phone.replace(/\D+/g, '');
  if (digits) return `cust-${digits}`;
  return phone || 'guest';
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

  const customerPhone = sanitizeString(body.customer_phone);
  const orderTotal = sanitizeNumber(body.order_total, 0);
  const subtotal = sanitizeNumber(body.subtotal ?? orderTotal, orderTotal);
  const tableNumber = sanitizeString(body.table_number);
  const items = sanitizeArray(body.items);
  const deviceInfo = body && body.device_info && typeof body.device_info === 'object'
    ? body.device_info
    : {};
  const customerKey = normalizeCustomerKey(customerPhone);
  const ipAddress = sanitizeString(getClientIp(req));
  const userAgent = sanitizeString(req.headers.get('user-agent') || '');

  try {
    const [row] = await sql`
      INSERT INTO orders (
        table_no, cart, subtotal, total, discount_code,
        loyalty_discount, loyalty_rewards, loyalty_summary,
        drink_units, customer_key, customer_name, customer_phone,
        device_info, user_agent, ip_address
      )
      VALUES (
        ${tableNumber}, ${sql.json(items)}, ${subtotal}, ${orderTotal}, '',
        0, '[]'::jsonb, '{}'::jsonb,
        0, ${customerKey}, NULL, NULLIF(${customerPhone}, ''),
        ${sql.json(deviceInfo)}, ${userAgent}, ${ipAddress}
      )
      RETURNING *`;

    const res = okJSON({ success: true, order: row }, 201);
    addCORS(res);
    return res;
  } catch (err) {
    console.error('Error saving order', err);
    const res = okJSON({ error: 'database_error' }, 500);
    addCORS(res);
    return res;
  }
};
