// Script inicial de MongoDB (se ejecuta solo al crear el volumen).
// Crea un usuario ADMIN del sistema para poder gestionar restaurantes y entregas.
// Contrasena: admin123  (hash bcrypt generado con bcryptjs, 8 rondas)
db = db.getSiblingDB('bd_usuarios');

db.users.createIndex({ email: 1 }, { unique: true });

db.users.insertOne({
  name: 'Administrador',
  email: 'admin@delivery.bo',
  password: '$2a$08$fZcNDBYNLeRjcIKjbst01eh1JNuce0FMLgOsZ1YJtT.u/nv8Je7YG',
  phone: '70000000',
  address: 'Sucre',
  role: 'admin',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0
});

print('bd_usuarios: usuario admin@delivery.bo creado');
