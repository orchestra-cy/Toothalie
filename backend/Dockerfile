# ==========================================
# BUILD STAGE
# ==========================================
FROM php:8.4-fpm AS builder

WORKDIR /app

# Install system dependencies, including Node.js for frontend assets
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    nodejs \
    npm \
    && docker-php-ext-install pdo pdo_mysql \
    && echo "memory_limit=512M" > /usr/local/etc/php/conf.d/memory-limit.ini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1

COPY composer.json composer.lock ./
COPY package.json package-lock.json* ./

RUN composer install --no-interaction --no-scripts --optimize-autoloader
RUN npm install

# Copy application code
COPY . .

RUN npm run build

# Generate a fallback .env if one doesn't exist
RUN if [ ! -f .env ]; then echo "APP_ENV=prod\nAPP_DEBUG=false\nAPP_SECRET=SomeRandomString" > .env; fi

RUN composer install --no-interaction --optimize-autoloader --no-ansi || true
RUN php bin/console importmap:install --no-interaction || true
RUN php bin/console cache:warmup --env=prod --no-debug || true

# ==========================================
# RUNTIME STAGE
# ==========================================
FROM php:8.4-fpm AS runtime

WORKDIR /app

# Install Nginx and required runtime packages
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && docker-php-ext-install pdo pdo_mysql \
    && echo "memory_limit=512M" > /usr/local/etc/php/conf.d/memory-limit.ini \
    && rm -rf /var/lib/apt/lists/*

# Copy built application from builder stage
COPY --from=builder /app /app

# Set correct permissions for Symfony cache and logs
RUN mkdir -p /app/var && \
    chown -R www-data:www-data /app && \
    chmod -R 755 /app && \
    chmod -R 775 /app/var

# Setup Nginx configurations
COPY nginx-main.conf /etc/nginx/nginx.conf
RUN rm -rf /etc/nginx/conf.d/* /etc/nginx/sites-enabled /etc/nginx/sites
COPY nginx.conf /etc/nginx/conf.d/symfony.conf

# Setup the entrypoint script
COPY entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]