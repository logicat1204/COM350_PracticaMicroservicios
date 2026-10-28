-- Script inicial de bd_restaurantes (se ejecuta solo al crear el volumen de MySQL)
-- La base de datos ya fue creada por la variable MYSQL_DATABASE del compose.
USE bd_restaurantes;

CREATE TABLE IF NOT EXISTS restaurant (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     VARCHAR(200) NOT NULL,
  phone       VARCHAR(20),
  category    VARCHAR(50)  NOT NULL,           -- comida tipica, pizzeria, hamburguesas, etc.
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dish (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT           NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  description   VARCHAR(255),
  price         DECIMAL(10,2) NOT NULL,
  available     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dish_restaurant FOREIGN KEY (restaurant_id)
    REFERENCES restaurant(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Datos de prueba (Sucre)
INSERT INTO restaurant (name, address, phone, category) VALUES
  ('El Huerto',           'Calle Ladislao Cabrera 86',    '4-6451538', 'comida tipica'),
  ('Pizzeria Napolitana', 'Plaza 25 de Mayo 30',          '4-6433222', 'pizzeria'),
  ('Burger Sucre',        'Av. Hernando Siles 950',       '7-2345678', 'hamburguesas'),
  ('Salteneria El Patio', 'Calle San Alberto 18',         '4-6454917', 'saltenas');

INSERT INTO dish (restaurant_id, name, description, price) VALUES
  (1, 'Mondongo chuquisaqueno', 'Cerdo en salsa de aji colorado con mote y papa', 45.00),
  (1, 'Chorizo chuquisaqueno',  'Chorizo criollo con pan y ensalada',             30.00),
  (1, 'Pastel de choclo',       'Pastel de maiz con relleno de carne',            25.00),
  (2, 'Pizza Margarita',        'Salsa de tomate, mozzarella y albahaca',         55.00),
  (2, 'Pizza Napolitana',       'Mozzarella, anchoas y aceitunas',                65.00),
  (2, 'Lasagna de carne',       'Capas de pasta, carne molida y bechamel',        48.00),
  (3, 'Hamburguesa clasica',    'Carne 150 g, queso, lechuga y tomate',           28.00),
  (3, 'Hamburguesa doble',      'Doble carne, doble queso y tocino',              42.00),
  (3, 'Papas fritas',           'Porcion grande',                                 12.00),
  (4, 'Saltena de pollo',       'Saltena jugosa de pollo',                         7.00),
  (4, 'Saltena de carne',       'Saltena jugosa de carne',                         7.00);
