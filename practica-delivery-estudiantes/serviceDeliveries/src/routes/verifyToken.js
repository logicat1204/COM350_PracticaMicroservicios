const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'deliverySucre2026superSecreto';

/**
 * Middleware: valida el header "Authorization: Bearer <token>".
 * Si es valido, deja en req.user el payload { id, name, role }.
 */
function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ auth: false, message: 'Token no proporcionado' });
  }
  const token = header.substring(7);
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ auth: false, message: 'Token invalido o expirado' });
  }
}

/** Middleware: solo permite continuar si el rol del token esta en la lista. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Se requiere rol: ${roles.join(' o ')}` });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
