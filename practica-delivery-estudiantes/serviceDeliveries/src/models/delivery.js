const pool = require('../config/db');

const Delivery = {
  async findAll({ status, courier_id } = {}) {
    let sql = 'SELECT * FROM deliveries WHERE 1=1';
    const params = [];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (courier_id) { params.push(courier_id); sql += ` AND courier_id = $${params.length}`; }
    sql += ' ORDER BY id DESC';
    return (await pool.query(sql, params)).rows;
  },
  async findById(id) {
    return (await pool.query('SELECT * FROM deliveries WHERE id = $1', [id])).rows[0] || null;
  },
  async findByOrder(orderId) {
    return (await pool.query('SELECT * FROM deliveries WHERE order_id = $1', [orderId])).rows[0] || null;
  },
  async create({ order_id, courier_id, courier_name, notes }) {
    const result = await pool.query(
      'INSERT INTO deliveries (order_id, courier_id, courier_name, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [order_id, courier_id, courier_name, notes || null]);
    return result.rows[0];
  },
  async updateStatus(id, status, previousStatus) {
    const result = await pool.query(
      `UPDATE deliveries SET status = $1,
       delivered_at = CASE WHEN $1 = 'entregado' THEN NOW() ELSE delivered_at END
       WHERE id = $2 AND status = $3 RETURNING *`, [status, id, previousStatus]);
    return result.rows[0] || null;
  },
  async remove(id) {
    return (await pool.query('DELETE FROM deliveries WHERE id = $1', [id])).rowCount > 0;
  }
};
module.exports = Delivery;
