# 1. Use PHP 8.4 with Apache (Replaces ZTS and the built-in php -S server)
FROM php:8.4-apache

ENV COMPOSER_ALLOW_SUPERUSER=1

# Use standard Apache directory or configure it to /app
WORKDIR /app

# 2. Install required packages and PHP extensions (including yours + intl for Symfony)
RUN apt-get update && apt-get install -y \
    git \
    libzip-dev \
    zip \
    unzip \
    libicu-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install zip pdo_mysql pcntl intl opcache

# 3. Configure Apache for Symfony and Railway's dynamic PORT
RUN a2enmod rewrite
ENV APACHE_DOCUMENT_ROOT /app/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/app/!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# 4. Install Composer and Symfony CLI
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN curl -sS https://get.symfony.com/cli/installer | bash \
    && mv /root/.symfony5/bin/symfony /usr/local/bin/symfony

# 5. Install Dependencies (Optimized two-step copy)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction

# 6. Copy Application Code
COPY . .

# Ensure .env exists in the container for Symfony runtime bootstrapping.
RUN test -f .env || touch .env

RUN composer dump-autoload --optimize

# 7. Set Permissions for Apache to write to cache and logs
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var/cache var/log public

# 8. Create a Startup Script (Handles JWT Keys, Migrations, and starts Apache)
RUN echo '#!/bin/bash\n\
# Generate JWT keys if they are missing\n\
php bin/console lexik:jwt:generate-keypair --skip-if-exists\n\
# Automatically run database migrations\n\
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration\n\
# Start the Apache server in the foreground\n\
apache2-foreground' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

# 9. Execute the startup script on container boot
CMD ["/usr/local/bin/start.sh"]