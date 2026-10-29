require('dotenv').config();
const express = require('express');
const restaurantRoutes = require('./routes/restaurantRoutes');
const dishRoutes = require('./routes/dishRoutes');

const app = express();
app.set('port', process.env.PORT || 3002);

// middlewares
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[restaurants] ${req.method} ${req.originalUrl}`);
  next();
});

// rutas (el prefijo /api/v1 coincide con las "location" de nginx)
app.get('/health', async (req, res) => {
  try {
    await require('./config/dbConnection').query('SELECT 1');
    res.json({ service: 'restaurants', database: 'ok' });
  } catch (err) { res.status(503).json({ service: 'restaurants', database: 'error' }); }
});

app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/dishes', dishRoutes);

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada en restaurants' }));

app.listen(app.get('port'), () => {
  console.log('[restaurants] servidor escuchando en el puerto', app.get('port'));
});
