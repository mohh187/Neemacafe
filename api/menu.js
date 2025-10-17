function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function createEmptyMenu() {
  return { categories: [] };
}

let MENU = globalThis.NEEMA_MENU ?? null;

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    if (!MENU) {
      return sendJson(res, 200, null);
    }
    return sendJson(res, 200, MENU);
  }

  if (method === 'PUT') {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return sendJson(res, 400, { error: 'invalid payload' });
    }
    if (!Array.isArray(payload.categories)) {
      return sendJson(res, 400, { error: 'menu categories must be an array' });
    }
    MENU = payload;
    globalThis.NEEMA_MENU = MENU;
    return sendJson(res, 200, MENU);
  }

  if (method === 'DELETE') {
    MENU = createEmptyMenu();
    globalThis.NEEMA_MENU = MENU;
    return sendJson(res, 200, MENU);
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}
