# Práctica: Delivery Sucre

COM350 - Arquitectura de Software, gestión 2/2026.

Se usó el código base y la organización de `10-27`: conexión, modelos con consultas
SQL y rutas Express. Pedidos sigue B.1 a B.12 con Laravel 12. Entregas usa Node y pg.
Se eligieron CORS y versionado para C.2. No se incluye el ejercicio opcional C.3.

## Arranque

Iniciar Docker Desktop (contenedores Linux) y abrir terminal en esta carpeta:

```bash
docker compose up -d --build
docker compose ps
```

Gateway: http://localhost. El compose instala dependencias, inicializa las bases y
migra Laravel. La primera construcción requiere Internet. Los ocho contenedores
tienen healthcheck. No se necesita Node, PHP o Composer local para ejecutar Docker.
Administrador inicial: `admin@delivery.bo` / `admin123`.

Los `.env` incluyen los datos de laboratorio. Compose cambia localhost por los
hosts mongodb, mysql y postgres, y pasa el mismo JWT_SECRET a los cuatro servicios.
Para cambiar el puerto de entrada editar NGINX_PORT. Mantener los nombres de las
bases y usuario de los scripts init. Los puertos 3001, 3002, 8000 y 3004 se conservan
publicados para depurar, como en la guía.

```bash
docker compose logs --tail=30 orders restaurants deliveries nginx
docker compose exec orders php artisan migrate:status
docker compose exec orders php artisan route:list
docker compose exec postgres psql -U delivery -d bd_entregas -c "\dt"
```

Detener conservando datos: `docker compose down`.
Para repetir desde cero (**down -v elimina los datos de esta práctica**):

```bash
docker compose down -v
docker compose up -d --build
```

## Postman

Importar Delivery.postman_collection.json y ejecutar las carpetas 0 a 5 en orden
con Collection Runner. Se guardan tokens e identificadores y se generan correos
nuevos en cada ejecución. Se comprueban también los errores esperados.

1. Login admin; registrar y autenticar cliente y dos repartidores.
2. Consultar restaurantes, menú y permisos.
3. Crear pedido del restaurante 1: dos platos 1 y un plato 3, total **Bs 115.00**.
4. Admin confirma y pasa a en_preparacion.
5. Admin asigna entrega; repartidor pasa por recogido, en_camino y entregado.
6. Cliente consulta su pedido: entregado.

## Endpoints

Prefijo http://localhost/api/v1. Enviar `Authorization: Bearer <token>`.

| Método | Ruta | Permiso |
|---|---|---|
| GET | / (sin prefijo) | Público: gateway |
| POST | /users, /login | Público |
| GET | /login/me | Autenticado |
| GET | /users?role=repartidor | Admin |
| GET / PUT | /users/:id | Dueño o admin |
| DELETE | /users/:id | Admin |
| GET | /restaurants, /restaurants/:id, /restaurants/:id/dishes | Autenticado |
| POST | /restaurants | Admin |
| PUT / DELETE | /restaurants/:id | Admin |
| GET | /dishes, /dishes/:id | Autenticado |
| POST | /dishes | Admin |
| PUT / DELETE | /dishes/:id | Admin |
| GET | /orders?status=pendiente, /orders/:id | Cliente: propios; admin y repartidor: todos |
| POST | /orders | Cliente o admin |
| PATCH | /orders/:id/status | Según rol y estado |
| DELETE | /orders/:id | Admin |
| GET | /deliveries?status=asignado | Admin todas; repartidor las suyas |
| GET | /deliveries/:id, /deliveries/order/:orderId | Admin, repartidor dueño o cliente dueño del pedido |
| POST | /deliveries | Admin |
| PUT | /deliveries/:id/status | Repartidor dueño o admin |
| DELETE | /deliveries/:id | Admin |

Pedido: pendiente → confirmado → en_preparacion → en_camino → entregado, o cancelado.
El cliente solo cancela su pendiente; admin gestiona; repartidor pone en_camino o
entregado. Entrega: asignado → recogido → en_camino → entregado. Se permiten saltos
hacia adelante, igual que en el controlador resuelto del PDF, pero no retrocesos.

Recogido y en_camino dejan el pedido en en_camino. Si ya tiene ese estado no se
repite PATCH. Si orders falla, se responde 502 sin avanzar la entrega. Sigue
existiendo una ventana de fallo entre los servicios, explicada en el informe.

## Mejoras C.2

**CORS:** nginx agrega headers incluso en errores y responde OPTIONS con 204.
Probar OPTIONS /api/v1/orders con Origin: http://localhost:5173 y
Access-Control-Request-Method: POST. Para laboratorio se permite cualquier origen;
se usan tokens Bearer sin cookies.

**Versionado:** /api/v2/orders apunta a la misma API. Nginx agrega X-Api-Version: 2
y Laravel registra la versión. Probar GET con token del cliente y ejecutar
`docker compose logs --tail=30 orders`; debe aparecer `"version":"2"`.

## Verificación local

Pasaron **28 comprobaciones de orders** (Laravel, SQLite en memoria, restaurants
simulado) y **26 de deliveries** (rutas Express y fetch reales, modelo en memoria
y servidor HTTP que simula orders). Cubren los nueve casos C.1, permisos, precios,
estados y fallos del servicio vecino. No reemplazan la integración con las tres
bases reales y nginx. Para repetirlas, con PHP/SQLite, Composer y Node 24:

```bash
cd serviceOrders
composer install
cd ../serviceDeliveries
npm ci
cd ..
php pruebas/verificar-orders.php
node pruebas/verificar-deliveries.cjs
```

Se revisaron sintaxis PHP/JavaScript, rutas Laravel, composer validate y
`docker compose config --quiet`.

**Pendiente de verificar en Docker:** Docker Desktop se cerró al iniciar por un
error del socket sailor-ingest.sock. No se pudieron construir ni ejecutar los
contenedores, medir memoria, capturar Postman o grabar el video. No se hizo un
reset de Docker ni se borraron volúmenes del equipo.

## Entrega

- Informe de seis páginas: output/pdf/Informe-Delivery-Sucre.pdf.
- Fuente editable: informe/Informe.md; generador: informe/generar_informe.py.
- Guion del video: informe/Guion-video.md.
- Evidencias locales: informe/evidencias/.
- Antes de entregar: completar integrantes, probar con Docker, agregar capturas
  reales al informe, medir docker stats --no-stream y grabar video.
- Nombre GitHub pedido: com350-microservicios-delivery-<apellido1>-<apellido2>.
  Se trabajó en el repositorio local existente; no se publicó ni renombró.

node_modules/ y vendor/ están ignorados y no deben subirse al repositorio.
