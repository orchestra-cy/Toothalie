# Build stage
FROM php:8.2-cli AS builder

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

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Production stage
FROM php:8.2-cli

# Set working directory
WORKDIR /app

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

# Copy application from builder
COPY --from=builder /app /app
COPY --from=builder /usr/local/bin/composer /usr/local/bin/composer

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p var/cache var/log && \
    chmod -R 755 var

# Expose ports (for documentation)
EXPOSE 8000 2206 1234

# Default command runs the Symfony development server
# Can be overridden by docker-compose for different services
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]