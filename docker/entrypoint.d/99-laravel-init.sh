#!/bin/sh
set -e

echo "==> [Laravel Entrypoint] Starting initialization tasks..."

if [ -z "${APP_KEY}" ]; then
    echo "==> Generate Laravel Application Key..."
    php artisan key:generate --no-interaction || true
fi

# Ensure storage symlink exists
if [ ! -L /var/www/html/public/storage ]; then
    echo "==> [Laravel Entrypoint] Creating storage symlink..."
    php artisan storage:link --no-interaction || true
fi

# Run database migrations if enabled via environment variable
if [ "${AUTORUN_LARAVEL_MIGRATION:-false}" = "true" ]; then
    echo "==> [Laravel Entrypoint] Running database migrations..."
    php artisan migrate --force --no-interaction
fi

# Cache config, routes, and views in production
if [ "${APP_ENV:-production}" = "production" ]; then
    echo "==> [Laravel Entrypoint] Optimizing caches for production..."
    php artisan config:cache --no-interaction || true
    php artisan route:cache --no-interaction || true
    php artisan view:cache --no-interaction || true
fi

echo "==> [Laravel Entrypoint] Initialization complete."
