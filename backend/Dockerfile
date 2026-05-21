FROM php:8.4-apache

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

# 1. Install required packages and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    libzip-dev \
    zip \
    unzip \
    libicu-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install zip pdo_mysql pcntl intl opcache

# 2. FIX: Aggressively delete all MPM symlinks, then strictly enable prefork + rewrite
RUN rm -f /etc/apache2/mods-enabled/mpm_*.load \
    && rm -f /etc/apache2/mods-enabled/mpm_*.conf \
    && a2enmod mpm_prefork rewrite

# 3. Configure Apache document root for Symfony
ENV APACHE_DOCUMENT_ROOT /app/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/app/!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 4. Use Railway's dynamic PORT at runtime
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# 5. Install Composer and Symfony CLI
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN curl -sS https://get.symfony.com/cli/installer | bash \
    && mv /root/.symfony5/bin/symfony /usr/local/bin/symfony

# 6. Install Dependencies
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction

# 7. Copy Application Code
COPY . .
RUN test -f .env || touch .env
RUN composer dump-autoload --optimize

# 8. Set permissions for Apache to write to cache and logs
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var/cache var/log public

# 9. Create a Startup Script
RUN echo '#!/bin/bash\n\
php bin/console lexik:jwt:generate-keypair --skip-if-exists\n\
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration\n\
apache2-foreground' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

# 10. Execute the startup script on container boot
CMD ["/usr/local/bin/start.sh"]