const pool = require('../config/dbConnection');

// Modelo "a mano" con consultas SQL parametrizadas (evita inyeccion SQL)
const Restaurant = {
  async findAll({ category, active } = {}) {
    let sql = 'SELECT * FROM restaurant WHERE 1=1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (active !== undefined) { sql += ' AND active = ?'; params.push(active === 'true' || active === '1' ? 1 : 0); }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM restaurant WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, address, phone, category }) {
    const [result] = await pool.query(
      'INSERT INTO restaurant (name, address, phone, category) VALUES (?, ?, ?, ?)',
      [name, address, phone || null, category]
    );
    return this.findById(result.insertId);
  },

  async update(id, { name, address, phone, category, active }) {
    const [result] = await pool.query(
      `UPDATE restaurant SET
         name = COALESCE(?, name), address = COALESCE(?, address), phone = COALESCE(?, phone),
         category = COALESCE(?, category), active = COALESCE(?, active)
       WHERE id = ?`,
      [name ?? null, address ?? null, phone ?? null, category ?? null, active ?? null, id]
    );
    return result.affectedRows ? this.findById(id) : null;
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM restaurant WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async dishes(id) {
    const [rows] = await pool.query('SELECT * FROM dish WHERE restaurant_id = ? ORDER BY name', [id]);
    return rows;
  }
};

module.exports = Restaurant;
