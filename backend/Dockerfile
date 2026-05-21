# Build stage
FROM php:8.3-cli AS builder

# Set working directory
WORKDIR /app

# Install system dependencies required by PHP extensions and Composer
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    curl \
    libzip-dev \
    zlib1g-dev \
    libpq-dev \
    && docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    zip \
    opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Allow Composer to run as root during the build
ENV COMPOSER_ALLOW_SUPERUSER=1

# Copy ONLY composer files first (this caches the expensive download step)
COPY composer.json composer.lock ./

# Install dependencies WITHOUT running scripts or generating autoloader yet
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

# Now copy the rest of your application code
COPY . .

# Ensure a .env file exists (prevents crashes if .env is blocked by .dockerignore)
RUN touch .env

# Generate the autoloader and safely run Symfony scripts
RUN composer dump-autoload --optimize \
    && composer run-script post-install-cmd || true

# Production stage
FROM php:8.3-cli

# Set working directory
WORKDIR /app

# Set default application environment
ENV APP_ENV=prod

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    zlib1g \
    libpq5 \
    default-mysql-client \
    procps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    zip \
    opcache

# Copy PHP configuration
RUN echo 'opcache.enable=1' >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo 'opcache.enable_cli=1' >> /usr/local/etc/php/conf.d/opcache.ini

# Copy the entire built application from the builder stage
COPY --from=builder /app /app
COPY --from=builder /usr/local/bin/composer /usr/local/bin/composer

# Create necessary directories and set permissions
RUN mkdir -p var/cache var/log && \
    chmod -R 777 var

# Expose ports
EXPOSE 8000 2206 1234

# Default command runs the Symfony development server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]