const baseUrl = (process.env.ORDERS_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

async function request(path, authorization, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: authorization, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000)
    });
  } catch (err) {
    const error = new Error('No se pudo conectar con orders');
    error.status = 502;
    throw error;
  }
  let data;
  try {
    data = await response.json();
  } catch (err) {
    const error = new Error('Orders no devolvio una respuesta JSON valida');
    error.status = 502;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(data.message || 'Error al consultar orders');
    error.status = response.status >= 500 ? 502 : response.status;
    throw error;
  }
  return data;
}

module.exports = {
  findOrder: (id, token) => request(`/orders/${id}`, token),
  updateStatus: (id, status, token) => request(`/orders/${id}/status`, token, 'PATCH', { status })
};
