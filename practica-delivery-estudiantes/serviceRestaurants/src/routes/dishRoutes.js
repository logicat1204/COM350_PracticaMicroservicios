/*
 CRUD DISHES (platos)
 - GET /api/v1/dishes/:id lo consume el microservicio ORDERS (Laravel) para
   validar que el plato existe y obtener su precio real.
*/
const router = require('express').Router();
const Dish = require('../models/dish');
const { verifyToken, requireRole } = require('./verifyToken');

// GET /api/v1/dishes?restaurant_id=1&available=true
router.get('/', verifyToken, async (req, res) => {
  try {
    res.json(await Dish.findAll(req.query));
  } catch (err) {
    res.status(500).json({ message: 'Error al listar platos', error: err.message });
  }
});

// GET /api/v1/dishes/:id
router.get('/:id', verifyToken, async (req, res) => {
  const d = await Dish.findById(req.params.id);
  if (!d) return res.status(404).json({ message: 'Plato no encontrado' });
  res.json(d);
});

// POST /api/v1/dishes
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const { restaurant_id, name, price } = req.body;
  if (!restaurant_id || !name || price === undefined) {
    return res.status(400).json({ message: 'restaurant_id, name y price son obligatorios' });
  }
  try {
    res.status(201).json(await Dish.create(req.body));
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'El restaurante indicado no existe' });
    }
    res.status(500).json({ message: 'Error al crear plato', error: err.message });
  }
});

// PUT /api/v1/dishes/:id
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const d = await Dish.update(req.params.id, req.body);
    if (!d) return res.status(404).json({ message: 'Plato no encontrado' });
    res.json(d);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar plato', error: err.message });
  }
});

// DELETE /api/v1/dishes/:id
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const ok = await Dish.remove(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Plato no encontrado' });
  res.json({ success: true, message: 'Plato eliminado', id: Number(req.params.id) });
});

module.exports = router;
