FROM php:8.4-cli

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    libzip-dev \
    unzip \
    && docker-php-ext-install zip pdo_mysql pcntl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

ARG APP_ENV=prod
ENV APP_ENV=${APP_ENV}
ENV APP_DEBUG=0

COPY composer.json composer.lock ./

RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

COPY . .

# Ensure .env exists in the container for Symfony runtime bootstrapping.
RUN test -f .env || touch .env

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} -t public"]
