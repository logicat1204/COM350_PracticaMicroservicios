require('dotenv').config();
const express = require('express');
const pool = require('./config/db');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[deliveries] ${req.method} ${req.originalUrl}`);
  next();
});
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ service: 'deliveries', database: 'ok' });
  } catch (err) { res.status(503).json({ service: 'deliveries', database: 'error' }); }
});
app.use('/api/v1/deliveries', require('./routes/deliveryRoutes'));
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada en deliveries' }));
app.use((err, req, res, next) => {
  console.error('[deliveries]', err.message);
  const status = err.status || (err.code === '22P02' ? 400 : 500);
  res.status(status).json({ message: status === 500 ? 'Error en el servicio deliveries' : err.message });
});

app.listen(process.env.PORT || 3004, () => console.log('[deliveries] escuchando en puerto', process.env.PORT || 3004));
