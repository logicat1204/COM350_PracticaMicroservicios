const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('./verifyToken');

const SECRET = process.env.JWT_SECRET || 'deliverySucre2026superSecreto';
const EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN) || 86400; // 24 horas

// POST /api/v1/login  -> { auth, token, user }
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email y password son obligatorios' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.active) {
      return res.status(404).json({ auth: false, message: 'Usuario no encontrado' });
    }
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) {
      return res.status(401).json({ auth: false, token: null, message: 'Credenciales invalidas' });
    }
    // El payload viaja a los demas microservicios: ellos solo necesitan id, name y role
    const payload = { id: user._id.toString(), name: user.name, role: user.role };
    const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
    res.json({ auth: true, token, user });
  } catch (err) {
    res.status(500).json({ message: 'Error en login', error: err.message });
  }
});

// GET /api/v1/login/me -> datos del usuario autenticado (util para probar el token)
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(user);
});

module.exports = router;
