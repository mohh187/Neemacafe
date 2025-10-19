import { sql } from './db.js';
import { ensureOrderEnhancements } from './_migrations.js';

const REPORT_TIMEZONE = 'Asia/Riyadh';
const DEFAULT_RECIPIENT = 'Moh.idris.18@gmail.com';

export const config = {
  schedule: '0 21 * * *'
};

async function fetchBounds() {
  const [bounds] = await sql`
    SELECT
      (date_trunc('day', timezone(${REPORT_TIMEZONE}, now())) - interval '1 day') AT TIME ZONE ${REPORT_TIMEZONE} AS start_utc,
      (date_trunc('day', timezone(${REPORT_TIMEZONE}, now()))) AT TIME ZONE ${REPORT_TIMEZONE} AS end_utc,
      to_char(date_trunc('day', timezone(${REPORT_TIMEZONE}, now())) - interval '1 day', 'YYYY-MM-DD') AS label
  `;
  return bounds;
}

function normalizeJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }
  return value;
}

function formatCurrency(num) {
  const value = Number(num || 0);
  return `${value.toFixed(2)} ر.س`;
}

function buildEmailContent(dateLabel, orders) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const summaryLines = [
    `التاريخ: ${dateLabel}`,
    `عدد الطلبات: ${totalOrders}`,
    `إجمالي الإيرادات: ${formatCurrency(totalRevenue)}`
  ];

  const orderLines = orders.map((order, idx) => {
    const customer = normalizeJson(order.customer, {});
    const cart = normalizeJson(order.cart, []);
    const createdAt = new Date(order.created_at);
    const orderLabel = order.order_code || `#${order.id}`;
    const itemsText = cart.map(item => {
      const options = Array.isArray(item.options) && item.options.length ? ` (خيارات: ${item.options.join('، ')})` : '';
      return `- ${item.name_ar || item.name_en || 'منتج'} ×${item.qty || 1}${options} — ${formatCurrency(Number(item.price || 0) * Number(item.qty || 1))}`;
    }).join('\n');

    return [
      `${idx + 1}. الطلب ${orderLabel}`,
      `   الطاولة: ${order.table_no || '-'}`,
      `   الوقت: ${createdAt.toLocaleString('ar-SA', { timeZone: REPORT_TIMEZONE })}`,
      `   العميل: ${customer.name || 'غير معروف'}`,
      customer.phone ? `   رقم العميل: ${customer.phone}` : null,
      `   الإجمالي: ${formatCurrency(order.total)}`,
      `   محتوى الطلب:\n${itemsText || '- لا توجد عناصر -'}`
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const textBody = [...summaryLines, '', 'الطلبات:', orderLines || 'لا توجد طلبات مسجلة لهذا اليوم.'].join('\n');

  const htmlOrders = orders.map(order => {
    const customer = normalizeJson(order.customer, {});
    const cart = normalizeJson(order.cart, []);
    const createdAt = new Date(order.created_at);
    const orderLabel = order.order_code || `#${order.id}`;
    const itemsHtml = cart.map(item => {
      const options = Array.isArray(item.options) && item.options.length ? ` <em>(خيارات: ${item.options.join('، ')})</em>` : '';
      const lineTotal = Number(item.price || 0) * Number(item.qty || 1);
      return `<li>${item.name_ar || item.name_en || 'منتج'} ×${item.qty || 1}${options} — ${formatCurrency(lineTotal)}</li>`;
    }).join('');

    return `
      <section style="margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #eee;">
        <h3 style="margin:0 0 6px;">الطلب ${orderLabel}</h3>
        <p style="margin:4px 0;">الطاولة: <strong>${order.table_no || '-'}</strong></p>
        <p style="margin:4px 0;">الوقت: ${createdAt.toLocaleString('ar-SA', { timeZone: REPORT_TIMEZONE })}</p>
        <p style="margin:4px 0;">العميل: <strong>${customer.name || 'غير معروف'}</strong></p>
        ${customer.phone ? `<p style="margin:4px 0;">رقم العميل: ${customer.phone}</p>` : ''}
        <p style="margin:4px 0;">الإجمالي: <strong>${formatCurrency(order.total)}</strong></p>
        <details style="margin-top:6px;">
          <summary>عرض التفاصيل</summary>
          <ul>${itemsHtml || '<li>لا توجد عناصر</li>'}</ul>
        </details>
      </section>
    `;
  }).join('');

  const htmlBody = `
    <div style="font-family:system-ui, -apple-system, 'Segoe UI', sans-serif; color:#333;">
      <h2 style="margin-top:0;">تقرير نهاية اليوم — ${dateLabel}</h2>
      <ul>
        <li>عدد الطلبات: <strong>${totalOrders}</strong></li>
        <li>إجمالي الإيرادات: <strong>${formatCurrency(totalRevenue)}</strong></li>
      </ul>
      ${orders.length ? htmlOrders : '<p>لا توجد طلبات مسجلة لهذا اليوم.</p>'}
    </div>
  `;

  return { textBody, htmlBody, subject: `تقرير نهاية اليوم — ${dateLabel}` };
}

async function sendEmail(subject, text, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_SENDER_EMAIL;
  const to = process.env.DAILY_REPORT_RECIPIENT || DEFAULT_RECIPIENT;

  if (!apiKey || !from) {
    console.warn('Missing RESEND_API_KEY or REPORT_SENDER_EMAIL environment variables.');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Failed to send daily report email', res.status, detail);
  }
}

export default async () => {
  await ensureOrderEnhancements();

  const bounds = await fetchBounds();
  const orders = await sql`
    SELECT id, order_code, table_no, cart, total, customer, created_at
    FROM orders
    WHERE created_at >= ${bounds.start_utc}
      AND created_at < ${bounds.end_utc}
    ORDER BY created_at
  `;

  const { textBody, htmlBody, subject } = buildEmailContent(bounds.label, orders);
  await sendEmail(subject, textBody, htmlBody);

  return new Response('ok', { status: 200 });
};
