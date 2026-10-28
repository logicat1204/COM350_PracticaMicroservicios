-- Script inicial de PostgreSQL (se ejecuta solo al crear el volumen).
-- La base bd_pedidos ya fue creada por POSTGRES_DB; Laravel crea sus tablas con migraciones.
-- Aqui creamos la SEGUNDA base de datos, bd_entregas, para el microservicio de entregas (Node).
-- Patron "una base de datos por servicio": comparten el servidor, pero no el esquema.

CREATE DATABASE bd_entregas OWNER delivery;

\connect bd_entregas

CREATE TABLE IF NOT EXISTS deliveries (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER      NOT NULL,            -- id del pedido en el servicio orders (sin FK: otra BD)
  courier_id    VARCHAR(40)  NOT NULL,            -- _id del repartidor en MongoDB (servicio users)
  courier_name  VARCHAR(100) NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'asignado'
                CHECK (status IN ('asignado', 'recogido', 'en_camino', 'entregado')),
  notes         VARCHAR(255),
  assigned_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  delivered_at  TIMESTAMP,
  CONSTRAINT uq_delivery_order UNIQUE (order_id)  -- un pedido tiene una sola entrega
);

CREATE INDEX IF NOT EXISTS idx_deliveries_courier ON deliveries (courier_id);
