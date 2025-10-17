let ITEMS = globalThis.NEEMA_ITEMS || null;
if (!ITEMS) {
  ITEMS = [];
  globalThis.NEEMA_ITEMS = ITEMS;
}

function randomId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    return sendJson(res, 200, ITEMS);
  }

  if (method === 'POST') {
    const payload = req.body || {};
    const item = {
      id: randomId(),
      ...payload
    };
    ITEMS.push(item);
    return sendJson(res, 201, item);
  }

  if (method === 'PUT') {
    const id = req.query?.id;
    if (!id) {
      return sendJson(res, 400, { error: 'missing id' });
    }
    const index = ITEMS.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return sendJson(res, 404, { error: 'not found' });
    }
    ITEMS[index] = {
      ...ITEMS[index],
      ...(req.body || {})
    };
    return sendJson(res, 200, ITEMS[index]);
  }

  if (method === 'DELETE') {
    const id = req.query?.id;
    if (!id) {
      return sendJson(res, 400, { error: 'missing id' });
    }
    ITEMS = ITEMS.filter((entry) => entry.id !== id);
    globalThis.NEEMA_ITEMS = ITEMS;
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}
