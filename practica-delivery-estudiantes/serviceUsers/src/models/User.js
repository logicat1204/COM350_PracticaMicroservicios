const mongoose = require('mongoose');

// Roles del sistema de delivery
const ROLES = ['cliente', 'repartidor', 'admin'];

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },          // hash bcrypt, nunca texto plano
  phone:    { type: String, trim: true },
  address:  { type: String, trim: true },
  role:     { type: String, enum: ROLES, default: 'cliente' },
  active:   { type: Boolean, default: true }
}, { timestamps: true });

// Nunca devolver el hash de la contrasena en las respuestas
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLES = ROLES;
