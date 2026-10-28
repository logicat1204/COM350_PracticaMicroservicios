const mysql = require('mysql2/promise');

// Variables definidas en .env (local) o en docker-compose.yml (contenedor)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bd_restaurantes',
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  decimalNumbers: true          // DECIMAL -> number (no string)
});

pool.getConnection()
  .then(conn => { console.log(`[restaurants] conectado a MySQL en ${process.env.DB_HOST}:${process.env.DB_PORT}`); conn.release(); })
  .catch(err => console.error('[restaurants] error al conectar a MySQL:', err.message));

module.exports = pool;
