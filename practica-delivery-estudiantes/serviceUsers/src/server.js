require('dotenv').config();
const express = require('express');
require('./config/db');               // abre la conexion a MongoDB
const userRoutes = require('./routes/userRoutes');
const loginRoutes = require('./routes/loginRoutes');

const app = express();
app.set('port', process.env.PORT || 3001);

// middlewares
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[users] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (req, res) => {
  const connected = require('mongoose').connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ service: 'users', database: connected ? 'ok' : 'error' });
});

// rutas (el prefijo /api/v1 coincide con las "location" de nginx)
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/login', loginRoutes);

// 404 en formato JSON
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada en users' }));

app.listen(app.get('port'), () => {
  console.log('[users] servidor escuchando en el puerto', app.get('port'));
});
