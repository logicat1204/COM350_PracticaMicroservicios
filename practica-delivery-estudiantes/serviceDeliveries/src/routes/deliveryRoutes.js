const router = require('express').Router();
const Delivery = require('../models/delivery');
const orders = require('../config/ordersClient');
const { verifyToken, requireRole } = require('./verifyToken');
const statuses = ['asignado', 'recogido', 'en_camino', 'entregado'];

router.use(verifyToken);

// El administrador ve todas; el repartidor solamente las suyas.
router.get('/', requireRole('admin', 'repartidor'), async (req, res, next) => {
  try {
    const filter = { status: req.query.status };
    if (filter.status && !statuses.includes(filter.status)) {
      return res.status(400).json({ message: 'Estado invalido' });
    }
    if (req.user.role === 'repartidor') filter.courier_id = req.user.id;
    res.json(await Delivery.findAll(filter));
  } catch (err) { next(err); }
});

// Esta ruta va antes de /:id para que no se confundan.
router.get('/order/:orderId', async (req, res, next) => {
  try {
    const delivery = await Delivery.findByOrder(req.params.orderId);
    if (!delivery) return res.status(404).json({ message: 'Entrega no encontrada' });
    const order = await orders.findOrder(delivery.order_id, req.headers.authorization);
    if (req.user.role === 'repartidor' && delivery.courier_id !== req.user.id) {
      return res.status(403).json({ message: 'Esta entrega no es suya' });
    }
    // orders tambien comprueba que el cliente sea el dueno del pedido.
    res.json({ ...delivery, order });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Entrega no encontrada' });
    if (req.user.role === 'repartidor' && delivery.courier_id !== req.user.id) {
      return res.status(403).json({ message: 'Esta entrega no es suya' });
    }
    const order = await orders.findOrder(delivery.order_id, req.headers.authorization);
    res.json({ ...delivery, order });
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  const { order_id, courier_id, courier_name, notes } = req.body;
  if (!Number.isInteger(order_id) || order_id < 1 ||
      typeof courier_id !== 'string' || !courier_id.trim() || courier_id.length > 40 ||
      typeof courier_name !== 'string' || !courier_name.trim() || courier_name.length > 100 ||
      (notes != null && (typeof notes !== 'string' || notes.length > 255))) {
    return res.status(400).json({ message: 'order_id, courier_id y courier_name son obligatorios y deben ser validos' });
  }
  try {
    const order = await orders.findOrder(order_id, req.headers.authorization);
    if (!['confirmado', 'en_preparacion'].includes(order.status)) {
      return res.status(409).json({ message: `El pedido esta ${order.status}; debe estar confirmado o en_preparacion` });
    }
    if (await Delivery.findByOrder(order_id)) {
      return res.status(409).json({ message: 'El pedido ya tiene una entrega asignada' });
    }
    res.status(201).json(await Delivery.create({ order_id, courier_id, courier_name, notes }));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'El pedido ya tiene una entrega asignada' });
    next(err);
  }
});

router.put('/:id/status', requireRole('admin', 'repartidor'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Entrega no encontrada' });
    if (req.user.role !== 'admin' && delivery.courier_id !== req.user.id) {
      return res.status(403).json({ message: 'Esta entrega no es suya' });
    }
    const { status } = req.body;
    if (!['recogido', 'en_camino', 'entregado'].includes(status)) {
      return res.status(400).json({ message: 'Estado invalido' });
    }
    if (statuses.indexOf(status) <= statuses.indexOf(delivery.status)) {
      return res.status(409).json({ message: 'No se puede repetir ni retroceder el estado de la entrega' });
    }

    const orderStatus = status === 'entregado' ? 'entregado' : 'en_camino';
    let order = await orders.findOrder(delivery.order_id, req.headers.authorization);
    // recogido y en_camino producen el mismo estado en orders. Evitamos repetir el PATCH.
    if (order.status !== orderStatus) {
      order = await orders.updateStatus(delivery.order_id, orderStatus, req.headers.authorization);
    }
    // Si orders falla, no avanzamos la entrega y el usuario puede reintentar.
    const updated = await Delivery.updateStatus(delivery.id, status, delivery.status);
    if (!updated) return res.status(409).json({ message: 'La entrega cambio, vuelva a consultar' });
    res.json({ ...updated, orderSync: { ok: true, status: order.status } });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    if (!await Delivery.remove(req.params.id)) return res.status(404).json({ message: 'Entrega no encontrada' });
    res.json({ success: true, message: 'Entrega eliminada', id: Number(req.params.id) });
  } catch (err) { next(err); }
});

module.exports = router;
