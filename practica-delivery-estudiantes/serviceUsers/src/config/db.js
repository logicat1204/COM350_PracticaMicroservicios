const mongoose = require('mongoose');

// Variables definidas en .env (local) o en docker-compose.yml (contenedor)
const host = process.env.MONGO_HOST || 'localhost';
const port = process.env.MONGO_PORT || 27017;
const dbName = process.env.MONGO_DB || 'bd_usuarios';
const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;
const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';

const credentials = user ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` : '';
const uri = `mongodb://${credentials}${host}:${port}/${dbName}?authSource=${authSource}`;

mongoose.connect(uri)
  .then(() => console.log(`[users] conectado a MongoDB en ${host}:${port}/${dbName}`))
  .catch(err => console.error('[users] error al conectar a MongoDB:', err.message));

module.exports = mongoose;
