# Guion del video (máximo 5 minutos)

Este archivo es un guion. Falta grabar el video real con Docker y Postman.
Primero iniciar Docker Desktop y resolver el error sailor-ingest.sock.

## 0:00 - 1:10: arranque

Mostrar la carpeta y explicar los cuatro servicios, Nginx y las tres bases.
En un entorno de prueba, sin datos importantes, ejecutar:

```bash
docker compose down -v
docker compose up -d --build
docker compose ps
```

Down -v borra los volúmenes de esta práctica. Mostrar los ocho contenedores healthy.
Preparar las imágenes antes y recortar las esperas largas sin ocultar errores.

## 1:10 - 2:00: usuarios y restaurantes

Ejecutar carpetas 0, 1 y 2 de Postman. Mostrar URLs desde http://localhost,
login admin, cliente y repartidor. Consultar menú y mostrar 403 al crear un
restaurante con token del cliente.

## 2:00 - 3:00: pedidos

Ejecutar carpeta 3. Mostrar total Bs 115 y estado pendiente. Explicar que los
precios vienen de restaurants. Mostrar 422 por plato de otro restaurante.
Confirmar y pasar a preparación con admin.

## 3:00 - 4:10: entregas

Ejecutar carpeta 4. Mostrar asignación 201, duplicado 409 y cambio por otro
repartidor 403. Cambiar con el dueño a recogido, en_camino y entregado.
Mostrar orderSync.ok: true y consultar el pedido con cliente: entregado.

## 4:10 - 4:50: mejoras

Ejecutar carpeta 5. Mostrar OPTIONS 204 y headers CORS. Hacer GET /api/v2/orders
y mostrar version:2 en docker compose logs --tail=15 orders.

## 4:50 - 5:00: memoria

Mostrar docker stats --no-stream y anotar los valores reales en el informe.
Terminar explicando que cada servicio es dueño de su base de datos.
