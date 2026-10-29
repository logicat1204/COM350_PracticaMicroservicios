#!/bin/sh
set -e

echo "[orders] esperando a PostgreSQL en $DB_HOST:$DB_PORT ..."
for i in $(seq 1 30); do
  if php -r 'try { new PDO("pgsql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT").";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0); } catch (Exception $e) { exit(1); }'; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[orders] no se pudo conectar a PostgreSQL"
    exit 1
  fi
  sleep 2
done
echo "[orders] ejecutando migraciones ..."
php artisan migrate --force
exec php artisan serve --host=0.0.0.0 --port=8000
