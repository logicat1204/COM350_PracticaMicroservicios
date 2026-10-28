/*
 CRUD RESTAURANTS
 - Lectura: cualquier usuario autenticado
 - Escritura: solo admin
*/
const router = require('express').Router();
const Restaurant = require('../models/restaurant');
const { verifyToken, requireRole } = require('./verifyToken');

// GET /api/v1/restaurants?category=pizzeria&active=true
router.get('/', verifyToken, async (req, res) => {
  try {
    res.json(await Restaurant.findAll(req.query));
  } catch (err) {
    res.status(500).json({ message: 'Error al listar restaurantes', error: err.message });
  }
});

// GET /api/v1/restaurants/:id
router.get('/:id', verifyToken, async (req, res) => {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Restaurante no encontrado' });
  res.json(r);
});

// GET /api/v1/restaurants/:id/dishes  -> menu del restaurante
router.get('/:id/dishes', verifyToken, async (req, res) => {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Restaurante no encontrado' });
  res.json({ restaurant: r, dishes: await Restaurant.dishes(req.params.id) });
});

// POST /api/v1/restaurants
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, address, category } = req.body;
  if (!name || !address || !category) {
    return res.status(400).json({ message: 'name, address y category son obligatorios' });
  }
  try {
    res.status(201).json(await Restaurant.create(req.body));
  } catch (err) {
    res.status(500).json({ message: 'Error al crear restaurante', error: err.message });
  }
});

// PUT /api/v1/restaurants/:id
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const r = await Restaurant.update(req.params.id, req.body);
    if (!r) return res.status(404).json({ message: 'Restaurante no encontrado' });
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar restaurante', error: err.message });
  }
});

// DELETE /api/v1/restaurants/:id  (borra en cascada sus platos)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const ok = await Restaurant.remove(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Restaurante no encontrado' });
  res.json({ success: true, message: 'Restaurante eliminado', id: Number(req.params.id) });
});

module.exports = router;
