/**
 * Worker principal de Khaos Deportivo.
 *
 * - Sirve los archivos estáticos del sitio (index.html, css/, js/, imágenes, etc.)
 *   a través del binding de Assets, igual que antes.
 * - Expone /api/productos (GET) que lee el catálogo desde D1, en vez de leerlo
 *   en vivo desde raw.githubusercontent.com como hacía antes.
 * - Expone /api/admin/session (POST) y /api/admin/sync (POST) para que el
 *   panel admin publique el catálogo directo en D1, en vez de hacer commits
 *   a GitHub con un token guardado en el navegador.
 * - Expone /api/pedido (POST, público) para que el checkout del sitio guarde
 *   el pedido de verdad en la base de datos, y /api/admin/pedidos* (protegidos)
 *   para que el panel los liste, cree pedidos manuales y cambie su estado.
 * - Expone /api/admin/analytics (GET, protegido) con los agregados que usa la
 *   vista de Analíticas: ingresos, top productos, motivos de cancelación y uso
 *   de cupones — calculados en vivo desde los pedidos, nunca desde un contador
 *   que se pueda desincronizar.
 */

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h, igual que la sesión local del panel

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/productos' && request.method === 'GET') {
      return getProductos(env);
    }
    if (url.pathname === '/api/admin/session' && request.method === 'POST') {
      return adminSession(request, env);
    }
    if (url.pathname === '/api/admin/sync' && request.method === 'POST') {
      return adminSync(request, env);
    }
    if (url.pathname === '/api/pedido' && request.method === 'POST') {
      return crearPedidoPublico(request, env);
    }
    if (url.pathname === '/api/admin/pedidos' && request.method === 'GET') {
      return listarPedidos(request, env);
    }
    if (url.pathname === '/api/admin/pedido' && request.method === 'POST') {
      return crearPedidoAdmin(request, env);
    }
    if (url.pathname === '/api/admin/pedido/estado' && request.method === 'POST') {
      return actualizarEstadoPedido(request, env);
    }
    if (url.pathname === '/api/admin/pedido/eliminar' && request.method === 'POST') {
      return eliminarPedido(request, env);
    }
    if (url.pathname === '/api/admin/analytics' && request.method === 'GET') {
      return getAnalytics(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

/* ===== Lectura pública del catálogo ===== */

async function getProductos(env) {
  try {
    const [productosResult, cuponesResult] = await Promise.all([
      env.DB.prepare(
        'SELECT id, name, price, old_price, category, code, sizes, out_of_stock, image, images, descr, badge FROM productos ORDER BY id'
      ).all(),
      env.DB.prepare('SELECT data FROM cupones').all(),
    ]);

    const productos = productosResult.results.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      oldPrice: row.old_price,
      category: row.category,
      code: row.code,
      sizes: safeParseArray(row.sizes),
      outOfStock: safeParseArray(row.out_of_stock),
      image: row.image,
      images: safeParseArray(row.images),
      desc: row.descr,
      badge: row.badge,
    }));

    const cupones = cuponesResult.results.map((row) => JSON.parse(row.data));

    return json({ productos, cupones, version: 2, source: 'd1' });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

/* ===== Autenticación del panel admin ===== */
// No hay wrangler secret involucrado: la contraseña se hashea con un salt
// aleatorio y se guarda en D1 (tabla admin_auth, fila única id=1). La primera
// vez que alguien llama a /api/admin/session sin que exista esa fila, la
// contraseña que mande queda registrada como la contraseña del panel.

async function adminSession(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  const password = (body && body.password) || '';
  if (!password || password.length < 8) {
    return json({ error: 'weak_password' }, 400);
  }

  const row = await env.DB.prepare(
    'SELECT password_hash, salt, session_secret FROM admin_auth WHERE id = 1'
  ).first();

  if (!row) {
    const salt = randomHex(16);
    const sessionSecret = randomHex(32);
    const hash = await hashPassword(password, salt);
    await env.DB.prepare(
      'INSERT INTO admin_auth (id, password_hash, salt, session_secret) VALUES (1, ?, ?, ?)'
    )
      .bind(hash, salt, sessionSecret)
      .run();
    const token = await createToken(sessionSecret);
    return json({ token, expiresInMs: SESSION_TTL_MS, created: true });
  }

  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) {
    return json({ error: 'invalid_password' }, 401);
  }
  const token = await createToken(row.session_secret);
  return json({ token, expiresInMs: SESSION_TTL_MS, created: false });
}

async function requireAdmin(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, error: 'missing_token' };

  const row = await env.DB.prepare('SELECT session_secret FROM admin_auth WHERE id = 1').first();
  if (!row) return { ok: false, status: 401, error: 'not_configured' };

  const valid = await verifyToken(match[1], row.session_secret);
  if (!valid) return { ok: false, status: 401, error: 'invalid_token' };
  return { ok: true };
}

/* ===== Publicar catálogo (reemplaza el commit a GitHub) ===== */

async function adminSync(request, env) {
  const authResult = await requireAdmin(request, env);
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }

  const productos = Array.isArray(body.productos) ? body.productos : [];
  const cupones = Array.isArray(body.cupones) ? body.cupones : [];

  try {
    const stmts = [env.DB.prepare('DELETE FROM productos'), env.DB.prepare('DELETE FROM cupones')];

    for (const p of productos) {
      if (p == null || p.id == null) continue;
      const images = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
      stmts.push(
        env.DB.prepare(
          'INSERT INTO productos (id, name, price, old_price, category, code, sizes, out_of_stock, image, images, descr, badge) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        ).bind(
          p.id,
          p.name || '',
          Number(p.price) || 0,
          Number(p.oldPrice) || 0,
          p.category || '',
          p.code || '',
          JSON.stringify(p.sizes || []),
          JSON.stringify(p.outOfStock || []),
          images[0] || p.image || '',
          JSON.stringify(images),
          p.desc || '',
          p.badge || ''
        )
      );
    }

    for (const c of cupones) {
      const code = c && (c.code || c.codigo);
      if (!code) continue;
      stmts.push(env.DB.prepare('INSERT INTO cupones (code, data) VALUES (?, ?)').bind(String(code), JSON.stringify(c)));
    }

    await env.DB.batch(stmts);

    return json({ ok: true, count: productos.length });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

/* ===== Pedidos =====
 * Nota importante: el "uso" de un cupón (cuántas veces se aplicó, cuánto
 * ahorró) NUNCA se guarda como contador dentro de la tabla cupones. Si lo
 * hiciéramos, la próxima vez que el panel publique el catálogo (adminSync
 * hace DELETE + INSERT de cupones) ese contador se perdería. En vez de eso,
 * el uso se calcula en caliente a partir de la tabla pedidos (ver
 * getAnalytics), que es la fuente de verdad y nunca se sobreescribe al
 * publicar productos.
 */

async function crearPedidoPublico(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  return insertPedido(env, body, 'web', 'pending');
}

async function crearPedidoAdmin(request, env) {
  const authResult = await requireAdmin(request, env);
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  return insertPedido(env, body, 'manual', body.status || 'pending');
}

async function insertPedido(env, body, source, status) {
  const items = Array.isArray(body && body.items) ? body.items : [];
  if (items.length === 0) return json({ error: 'no_items' }, 400);

  const now = new Date().toISOString();
  try {
    const result = await env.DB.prepare(
      `INSERT INTO pedidos (customer, phone, address, items, subtotal, discount, coupon, total, status, source, payment_method, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
      .bind(
        (body.customer || 'Cliente Web').slice(0, 200),
        (body.phone || '').slice(0, 60),
        (body.address || '').slice(0, 300),
        JSON.stringify(items),
        Math.round(Number(body.subtotal) || 0),
        Math.round(Number(body.discount) || 0),
        body.coupon || null,
        Math.round(Number(body.total) || 0),
        status,
        source,
        (body.paymentMethod || '').slice(0, 40) || null,
        now,
        now
      )
      .run();

    return json({ ok: true, id: result.meta.last_row_id, date: now });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

async function listarPedidos(request, env) {
  const authResult = await requireAdmin(request, env);
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status);

  try {
    const rows = await env.DB.prepare(
      'SELECT id, customer, phone, address, items, subtotal, discount, coupon, total, status, cancel_reason, source, payment_method, created_at FROM pedidos ORDER BY created_at DESC LIMIT 500'
    ).all();
    const pedidos = rows.results.map(mapPedidoRow);
    return json({ pedidos });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

function mapPedidoRow(row) {
  return {
    id: row.id,
    customer: row.customer,
    phone: row.phone,
    address: row.address,
    items: safeParseArray(row.items),
    subtotal: row.subtotal,
    discount: row.discount,
    coupon: row.coupon,
    total: row.total,
    status: row.status,
    cancelReason: row.cancel_reason,
    source: row.source,
    paymentMethod: row.payment_method,
    date: row.created_at,
  };
}

async function actualizarEstadoPedido(request, env) {
  const authResult = await requireAdmin(request, env);
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  const id = Number(body.id);
  const status = body.status;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!id || !validStatuses.includes(status)) return json({ error: 'bad_request' }, 400);

  try {
    await env.DB.prepare('UPDATE pedidos SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?')
      .bind(status, status === 'cancelled' ? (body.cancelReason || '').slice(0, 300) || null : null, new Date().toISOString(), id)
      .run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

async function eliminarPedido(request, env) {
  const authResult = await requireAdmin(request, env);
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }
  const id = Number(body.id);
  if (!id) return json({ error: 'bad_request' }, 400);

  try {
    await env.DB.prepare('DELETE FROM pedidos WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

/* ===== Analíticas =====
 * Todo se calcula en vivo desde la tabla pedidos (nunca desde contadores
 * guardados aparte), incluyendo el uso real de cupones y qué productos
 * concentran más cancelaciones — la señal de confiabilidad.
 */

async function getAnalytics(request, env) {
  const authResult = await requireAdmin(request, env);
  if (!authResult.ok) return json({ error: authResult.error }, authResult.status);

  try {
    const [totalsRow, statusRows, topProductosRows, canceladosPorProductoRows, motivosRows, cuponesRows] =
      await Promise.all([
        env.DB.prepare(
          "SELECT COUNT(*) as pedidos, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END),0) as ingresos, COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END),0) as ticket_promedio FROM pedidos"
        ).first(),
        env.DB.prepare('SELECT status, COUNT(*) as n FROM pedidos GROUP BY status').all(),
        env.DB.prepare(
          `SELECT json_extract(je.value,'$.productId') as productId, json_extract(je.value,'$.name') as name,
                  SUM(json_extract(je.value,'$.qty')) as unidades, COUNT(DISTINCT pedidos.id) as pedidos
           FROM pedidos, json_each(pedidos.items) je
           WHERE pedidos.status != 'cancelled'
           GROUP BY productId, name ORDER BY unidades DESC LIMIT 8`
        ).all(),
        env.DB.prepare(
          `SELECT json_extract(je.value,'$.productId') as productId, json_extract(je.value,'$.name') as name,
                  COUNT(DISTINCT pedidos.id) as cancelados
           FROM pedidos, json_each(pedidos.items) je
           WHERE pedidos.status = 'cancelled'
           GROUP BY productId, name ORDER BY cancelados DESC LIMIT 8`
        ).all(),
        env.DB.prepare(
          "SELECT cancel_reason, COUNT(*) as n FROM pedidos WHERE status = 'cancelled' AND cancel_reason IS NOT NULL AND cancel_reason != '' GROUP BY cancel_reason ORDER BY n DESC"
        ).all(),
        env.DB.prepare(
          "SELECT coupon, COUNT(*) as usos, COALESCE(SUM(discount),0) as ahorrado FROM pedidos WHERE coupon IS NOT NULL AND coupon != '' GROUP BY coupon ORDER BY usos DESC"
        ).all(),
      ]);

    const cancelMap = {};
    canceladosPorProductoRows.results.forEach((r) => {
      cancelMap[r.productId] = r.cancelados;
    });

    const topProductos = topProductosRows.results.map((r) => ({
      productId: r.productId,
      name: r.name,
      unidades: r.unidades,
      pedidos: r.pedidos,
      cancelados: cancelMap[r.productId] || 0,
    }));

    return json({
      pedidos: totalsRow.pedidos,
      ingresos: totalsRow.ingresos,
      ticketPromedio: Math.round(totalsRow.ticket_promedio || 0),
      porEstado: statusRows.results,
      topProductos,
      motivosCancelacion: motivosRows.results,
      cupones: cuponesRows.results,
    });
  } catch (err) {
    return json({ error: 'db_error', message: String((err && err.message) || err) }, 500);
  }
}

/* ===== Utilidades ===== */

function safeParseArray(text) {
  try {
    const parsed = JSON.parse(text || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function randomHex(numBytes) {
  const arr = new Uint8Array(numBytes);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

async function hashPassword(password, saltHex) {
  const data = new TextEncoder().encode(password + ':' + saltHex);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuf);
}

async function hmacHex(secretHex, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToBytes(secretHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bufToHex(sigBuf);
}

async function createToken(sessionSecretHex) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = btoa(payload);
  const sig = await hmacHex(sessionSecretHex, payloadB64);
  return payloadB64 + '.' + sig;
}

async function verifyToken(token, sessionSecretHex) {
  const parts = (token || '').split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expectedSig = await hmacHex(sessionSecretHex, payloadB64);
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(atob(payloadB64));
    return !!payload.exp && Date.now() < payload.exp;
  } catch (e) {
    return false;
  }
}
