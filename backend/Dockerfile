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

# 2. Configure Apache document root for Symfony
ENV APACHE_DOCUMENT_ROOT /app/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/app/!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 3. Defer PORT wiring to runtime (Railway provides PORT at container start)

# 4. Install Composer and Symfony CLI
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN curl -sS https://get.symfony.com/cli/installer | bash \
    && mv /root/.symfony5/bin/symfony /usr/local/bin/symfony

# 5. Install Dependencies
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction

# 6. Copy Application Code
COPY . .
RUN test -f .env || touch .env
RUN composer dump-autoload --optimize

# 7. Set permissions for Apache to write to cache and logs
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var/cache var/log public

# 8. ULTIMATE STARTUP SCRIPT
# CRITICAL FIX: The $ in $PORT is escaped as \$ so it evaluates at RUNTIME, not build time.
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wire Apache to Railway port and suppress ServerName warning\n\
if [ -n "\$PORT" ]; then\n\
    sed -i "s/Listen 80/Listen \${PORT}/" /etc/apache2/ports.conf\n\
    sed -i "s/:80>/:\${PORT}>/" /etc/apache2/sites-available/000-default.conf\n\
fi\n\
echo "ServerName localhost" >> /etc/apache2/apache2.conf\n\
\n\
php bin/console lexik:jwt:generate-keypair --skip-if-exists\n\
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration\n\
\n\
# Forcefully remove conflicting MPM modules and enable prefork/rewrite\n\
rm -f /etc/apache2/mods-enabled/mpm_event.*\n\
rm -f /etc/apache2/mods-enabled/mpm_worker.*\n\
a2enmod mpm_prefork rewrite 2>/dev/null || true\n\
\n\
# Start Apache\n\
apache2-foreground' > /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

# 9. Execute the startup script on container boot
CMD ["/usr/local/bin/start.sh"]