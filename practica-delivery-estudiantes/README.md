# Práctica: Microservicios "Delivery Sucre" — versión para estudiantes

Código base de la práctica. Contiene lo necesario para la **PARTE A** de la guía:
- `docker-compose.yml` con MySQL, MongoDB, PostgreSQL y nginx (los servicios `orders` y
  `deliveries` están **comentados**: se agregan en las Partes B y C).
- `nginx/conf/nginx.conf` con los upstreams de `orders` y `deliveries` comentados.
- Scripts de inicialización de las tres bases de datos (`mysql/init`, `mongo/init`, `postgres/init`).
- `serviceUsers` (Node + MongoDB) y `serviceRestaurants` (Node + MySQL) completos.
- `serviceOrders`: **esqueleto mínimo** de Laravel 12 (sin rutas API, migraciones, middleware,
  controlador ni Dockerfile) para completar en la PARTE B.
- `Delivery.postman_collection.json` con los casos de prueba de las cuatro partes.

Usuario administrador inicial: `admin@delivery.bo` / `admin123`.

## Levantar la Parte A
```bash
docker compose up -d --build
docker compose ps
```
