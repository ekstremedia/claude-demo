# Single-image app container: PHP-FPM + nginx + Vite, run together by supervisor.
# Matches the PHP version that resolved composer.lock locally (8.4).
FROM php:8.4-fpm

# System deps + PHP extensions Laravel needs for Postgres + Redis.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        gnupg \
        unzip \
        zip \
        libpq-dev \
        postgresql-client \
        libonig-dev \
        libzip-dev \
        supervisor \
        nginx \
    && docker-php-ext-install pdo pdo_pgsql pgsql mbstring bcmath pcntl zip exif \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Node 22 LTS — Vite 8 / vue-tsc need a modern Node (Debian ships an old one).
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Upload limits, kept just under nginx's client_max_body_size.
RUN { \
        echo 'upload_max_filesize=64M'; \
        echo 'post_max_size=72M'; \
        echo 'memory_limit=512M'; \
    } > /usr/local/etc/php/conf.d/uploads.ini

# OPcache — caches compiled bytecode. Dev-safe: validate_timestamps=1 picks up
# edits to the bind-mounted source without a restart.
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.enable_cli=0'; \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.max_accelerated_files=15000'; \
        echo 'opcache.validate_timestamps=1'; \
        echo 'opcache.revalidate_freq=0'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# Composer (copied from the official image).
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Handy `a` shim so `docker compose exec app a migrate` works.
RUN printf '#!/bin/sh\nexec php /var/www/html/artisan "$@"\n' > /usr/local/bin/a \
    && chmod +x /usr/local/bin/a

WORKDIR /var/www/html

# Install PHP deps first (better layer caching). Skip scripts/autoloader until
# the full source is copied — artisan isn't present yet.
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction --prefer-dist

# Install JS deps next.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application.
COPY . .

# Finalize composer autoloader and pre-build assets (the dev server overrides
# these at runtime via public/hot, but this keeps the image runnable on its own).
RUN composer dump-autoload --optimize \
    && npm run build

# nginx + supervisor + entrypoint.
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

# Readiness signal off Laravel's /up health route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl --fail --silent --max-time 4 http://127.0.0.1/up || exit 1

ENTRYPOINT ["entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
