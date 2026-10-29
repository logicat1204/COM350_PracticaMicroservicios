const { Pool } = require('pg');

// Igual que en clases, usamos un pool para reutilizar las conexiones.
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USER || 'delivery',
  password: process.env.PG_PASSWORD || 'delivery123',
  database: process.env.PG_DATABASE || 'bd_entregas'
});
pool.on('error', err => console.error('[deliveries] PostgreSQL:', err.message));
module.exports = pool;
