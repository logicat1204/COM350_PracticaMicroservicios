FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --ignore-platform-reqs

FROM php:8.3-cli-alpine
RUN apk add --no-cache libpq oniguruma \
    && apk add --no-cache --virtual .build-deps postgresql-dev oniguruma-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo_pgsql mbstring \
    && apk del .build-deps
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
COPY --from=vendor /app/vendor ./vendor
RUN mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache \
    && composer dump-autoload --optimize --no-dev --no-interaction \
    && chmod -R 775 storage bootstrap/cache \
    && chmod +x docker/entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["sh", "docker/entrypoint.sh"]
