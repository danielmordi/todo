FROM serversideup/php:8.3-fpm-nginx AS build
USER root
RUN apt-get update && apt-get install -y curl \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN cp .env.example .env && php artisan key:generate \
 && npm ci && npm run build \
 && rm -rf .env node_modules

FROM serversideup/php:8.3-fpm-nginx
ENV AUTORUN_ENABLED=true
WORKDIR /var/www/html
COPY --from=build --chown=www-data:www-data /var/www/html .
RUN touch database/database.sqlite && chown www-data:www-data database/database.sqlite
