/*
 CRUD USERS  (Express + Mongoose)
*/
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyToken, requireRole } = require('./verifyToken');

// POST /api/v1/users  -> registro (publico). Solo un admin puede crear otros admin.
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    let { role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email y password son obligatorios' });
    }
    if (role === 'admin') role = 'cliente'; // en esta ruta publica nadie se autoproclama admin
    const hashed = bcrypt.hashSync(password, 8);
    const user = await User.create({ name, email, password: hashed, phone, address, role });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'El email ya esta registrado' });
    res.status(500).json({ message: 'Error al crear usuario', error: err.message });
  }
});

// GET /api/v1/users  -> lista (solo admin). Filtro opcional ?role=repartidor
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
});

// GET /api/v1/users/:id -> el propio usuario o un admin
router.get('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ message: 'No autorizado para ver este usuario' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Id invalido' });
  }
});

// PUT /api/v1/users/:id -> el propio usuario o un admin (solo admin cambia el rol)
router.put('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ message: 'No autorizado para modificar este usuario' });
  }
  const data = { ...req.body };
  if (data.password) data.password = bcrypt.hashSync(data.password, 8);
  if (req.user.role !== 'admin') { delete data.role; delete data.active; }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar', error: err.message });
  }
});

// DELETE /api/v1/users/:id -> solo admin
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ success: true, message: 'Usuario eliminado', id: req.params.id });
  } catch (err) {
    res.status(400).json({ message: 'Id invalido' });
  }
});

module.exports = router;
