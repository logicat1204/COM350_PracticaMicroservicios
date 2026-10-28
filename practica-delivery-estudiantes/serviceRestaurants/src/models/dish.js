const pool = require('../config/dbConnection');

const Dish = {
  async findAll({ restaurant_id, available } = {}) {
    let sql = `SELECT d.*, r.name AS restaurant_name
               FROM dish d JOIN restaurant r ON r.id = d.restaurant_id WHERE 1=1`;
    const params = [];
    if (restaurant_id) { sql += ' AND d.restaurant_id = ?'; params.push(restaurant_id); }
    if (available !== undefined) { sql += ' AND d.available = ?'; params.push(available === 'true' || available === '1' ? 1 : 0); }
    sql += ' ORDER BY r.name, d.name';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT d.*, r.name AS restaurant_name, r.active AS restaurant_active
       FROM dish d JOIN restaurant r ON r.id = d.restaurant_id WHERE d.id = ?`, [id]);
    return rows[0] || null;
  },

  async create({ restaurant_id, name, description, price }) {
    const [result] = await pool.query(
      'INSERT INTO dish (restaurant_id, name, description, price) VALUES (?, ?, ?, ?)',
      [restaurant_id, name, description || null, price]
    );
    return this.findById(result.insertId);
  },

  async update(id, { name, description, price, available }) {
    const [result] = await pool.query(
      `UPDATE dish SET
         name = COALESCE(?, name), description = COALESCE(?, description),
         price = COALESCE(?, price), available = COALESCE(?, available)
       WHERE id = ?`,
      [name ?? null, description ?? null, price ?? null, available ?? null, id]
    );
    return result.affectedRows ? this.findById(id) : null;
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM dish WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Dish;
