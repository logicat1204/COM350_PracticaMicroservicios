// Ejecuta las rutas reales de Express y el cliente fetch real.
// El modelo usa memoria y orders es un servidor local simulado: no prueba PostgreSQL.
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { once } = require('node:events');
const service = path.resolve(__dirname, '../serviceDeliveries');
const express = require(path.join(service, 'node_modules/express'));
const jwt = require(path.join(service, 'node_modules/jsonwebtoken'));
process.env.JWT_SECRET = 'prueba-local';
const token = (role, id) => jwt.sign({ role, id, name: id }, process.env.JWT_SECRET, { expiresIn: 600 });
const admin = token('admin', 'a1');
const courier = token('repartidor', 'r1');
const other = token('repartidor', 'r2');
const client = token('cliente', 'c1');
let rows = [], sequence = 0, patches = 0, offline = false, forwarded = false;
const orders = new Map([[1, { id: 1, status: 'en_preparacion' }], [2, { id: 2, status: 'pendiente' }],
  [3, { id: 3, status: 'confirmado' }]]);
const fakeOrders = http.createServer(async (req, res) => {
  forwarded = !!req.headers.authorization;
  res.setHeader('Content-Type', 'application/json');
  if (offline) { res.writeHead(503); return res.end('{"message":"Orders caido"}'); }
  const id = Number(req.url.split('/')[4]);
  const order = orders.get(id);
  if (!order) { res.writeHead(404); return res.end('{"message":"Pedido no encontrado"}'); }
  if (req.method === 'PATCH') {
    let body = ''; for await (const chunk of req) body += chunk;
    order.status = JSON.parse(body).status;
    patches++;
  }
  res.end(JSON.stringify(order));
});
const model = {
  findAll: async ({ status, courier_id }) => rows.filter(d => (!status || d.status === status) && (!courier_id || d.courier_id === courier_id)),
  findById: async id => rows.find(d => d.id === Number(id)) || null,
  findByOrder: async id => rows.find(d => d.order_id === Number(id)) || null,
  create: async data => { const row = { ...data, id: ++sequence, status: 'asignado', delivered_at: null }; rows.push(row); return row; },
  updateStatus: async (id, status) => { const row = rows.find(d => d.id === id); row.status = status; if (status === 'entregado') row.delivered_at = new Date().toISOString(); return row; },
  remove: async id => { const exists = rows.some(d => d.id === Number(id)); rows = rows.filter(d => d.id !== Number(id)); return exists; }
};
const modelPath = require.resolve(path.join(service, 'src/models/delivery.js'));
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: model };
let server, passed = 0;
function check(condition, label) { assert.ok(condition, label); passed++; console.log('OK:', label); }
async function run() {
  fakeOrders.listen(0, '127.0.0.1'); await once(fakeOrders, 'listening');
  process.env.ORDERS_URL = `http://127.0.0.1:${fakeOrders.address().port}/api/v1`;
  const app = express(); app.use(express.json());
  app.use('/api/v1/deliveries', require(path.join(service, 'src/routes/deliveryRoutes')));
  app.use((err, req, res, next) => res.status(err.status || 500).json({ message: err.message }));
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  async function call(method, suffix = '', body, auth = admin) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/deliveries${suffix}`, {
      method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, body: await response.json() };
  }
  const assignment = { order_id: 1, courier_id: 'r1', courier_name: 'Repartidor Uno' };
  check((await call('GET', '', null, null)).status === 401, 'Sin token: 401');
  check((await call('GET', '', null, admin + 'x')).status === 401, 'Token alterado: 401');
  check((await call('POST', '', assignment, courier)).status === 403, 'Solo admin asigna');
  let result = await call('POST', '', assignment);
  const id = result.body.id;
  check(result.status === 201 && result.body.status === 'asignado' && forwarded, 'C.1-1: asignar y reenviar Authorization');
  check((await call('POST', '', assignment)).status === 409, 'C.1-2: entrega duplicada');
  check((await call('POST', '', { ...assignment, order_id: 2 })).status === 409, 'C.1-3: pedido pendiente');
  check((await call('POST', '', { ...assignment, order_id: 999 })).status === 404, 'C.1-4: pedido inexistente');
  check((await call('GET', '', null, courier)).body.length === 1 && (await call('GET', '', null, other)).body.length === 0, 'C.1-5: cada repartidor lista las suyas');
  check((await call('PUT', `/${id}/status`, { status: 'recogido' }, other)).status === 403, 'C.1-6: otro repartidor no modifica');
  for (const status of ['recogido', 'en_camino', 'entregado']) {
    result = await call('PUT', `/${id}/status`, { status }, courier);
    check(result.status === 200 && result.body.orderSync.ok, `C.1-7: ${status} y orderSync.ok`);
  }
  check(patches === 2, 'No se repite PATCH en_camino al pasar de recogido a en_camino');
  check(!!result.body.delivered_at, 'Fecha delivered_at registrada');
  check((await call('PUT', `/${id}/status`, { status: 'recogido' }, courier)).status === 409, 'C.1-8: no retrocede');
  check(orders.get(1).status === 'entregado', 'C.1-9: pedido queda entregado');
  check((await call('GET', `/${id}`, null, courier)).body.order.status === 'entregado', 'Detalle incluye order');
  check((await call('GET', '/order/1', null, courier)).body.id === id, 'Consultar entrega por pedido');
  check((await call('GET', `/${id}`, null, other)).status === 403, 'Repartidor ajeno no ve detalle');
  check((await call('GET', '', null, client)).status === 403, 'Cliente no lista entregas ajenas');
  check((await call('POST', '', {})).status === 400, 'Validacion de asignacion');
  const next = await call('POST', '', { ...assignment, order_id: 3 });
  offline = true;
  check((await call('PUT', `/${next.body.id}/status`, { status: 'recogido' }, courier)).status === 502, 'Orders caido: 502');
  check(rows.find(d => d.order_id === 3).status === 'asignado', 'Si orders falla, no avanza entrega');
  offline = false;
  check((await call('PUT', `/${next.body.id}/status`, { status: 'recogido' }, courier)).status === 200, 'Se puede reintentar despues de la caida');
  check((await call('DELETE', `/${id}`, null, courier)).status === 403, 'Solo admin elimina');
  check((await call('DELETE', `/${id}`)).status === 200, 'Eliminar entrega');
  console.log(`\n${passed} comprobaciones de deliveries correctas (modelo en memoria y orders simulado).`);
}
run().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => {
  server?.close(); fakeOrders.close();
});
