# ===================================================
# Stage 1: Build Frontend Assets (Vite + Tailwind v4)
# ===================================================
FROM node:22-slim AS assets-builder

WORKDIR /app

# Cache npm dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build compiled frontend bundle
COPY . .
ENV WAYFINDER_COMMAND="true"
RUN npm run build

# ===================================================
# Stage 2: Install Composer Dependencies
# ===================================================
FROM composer:2 AS composer-builder

WORKDIR /app

# Cache composer package downloads
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-autoloader \
    --no-scripts \
    --prefer-dist \
    --ignore-platform-reqs

# Copy application source to generate optimized classmap
COPY . .
RUN composer dump-autoload --optimize --no-dev

# ===================================================
# Stage 3: Production Runtime (PHP 8.4 + Nginx + FPM)
# ===================================================
FROM serversideup/php:8.4-fpm-nginx

# ServerSideUp configuration flags
ENV AUTORUN_ENABLED=true \
    SSL_MODE=off \
    PHP_OPCACHE_ENABLE=1 \
    HEALTHCHECK_PATH="/up"

WORKDIR /var/www/html

# Copy application codebase
COPY --chown=www-data:www-data . .

# Copy vendor dependencies from composer builder
COPY --from=composer-builder --chown=www-data:www-data /app/vendor ./vendor

# Copy compiled frontend assets from assets builder
COPY --from=assets-builder --chown=www-data:www-data /app/public/build ./public/build

# Setup entrypoint script and directory permissions
USER root
COPY docker/entrypoint.d/99-laravel-init.sh /etc/entrypoint.d/99-laravel-init.sh
RUN chmod +x /etc/entrypoint.d/99-laravel-init.sh \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache
USER www-data

# ServerSideUp listens on unprivileged port 8080 by default
EXPOSE 8080

# Laravel 11/12 built-in healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/up || exit 1
