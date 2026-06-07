#!/bin/bash
set -e

# Storage + cache are bind-mounted from the host, so re-assert ownership on boot.
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Generate an app key if the .env doesn't have one yet.
if ! grep -qE '^APP_KEY=base64:' .env 2>/dev/null; then
    php artisan key:generate --force
fi

# Wait for Postgres (compose healthcheck usually covers this, but be defensive).
echo "Waiting for database at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-claude}" >/dev/null 2>&1; do
    sleep 1
done

# Migrations are idempotent — bring the schema up to date on every boot.
php artisan migrate --force

# Map public/storage -> storage/app/public (no-op if it already exists).
php artisan storage:link --force || true

# In local/dev, clear caches so .env / route / view edits take effect without a
# rebuild. In production we'd cache instead.
if [ "${APP_ENV:-local}" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
else
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
fi

exec "$@"
