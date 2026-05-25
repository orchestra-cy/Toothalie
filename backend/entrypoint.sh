#!/bin/bash
set -e

echo "Checking JWT keys..."

KEY_DIR="/app/config/jwt"
PRIVATE_KEY_PATH="$KEY_DIR/private.pem"
PUBLIC_KEY_PATH="$KEY_DIR/public.pem"

mkdir -p "$KEY_DIR"

KEYS_FROM_ENV=false

if [ -n "${JWT_PRIVATE_KEY_B64:-}" ]; then
  echo "$JWT_PRIVATE_KEY_B64" | base64 -d > "$PRIVATE_KEY_PATH"
  KEYS_FROM_ENV=true
elif [ -n "${JWT_PRIVATE_KEY:-}" ]; then
  printf "%b" "$JWT_PRIVATE_KEY" > "$PRIVATE_KEY_PATH"
  KEYS_FROM_ENV=true
fi

if [ -n "${JWT_PUBLIC_KEY_B64:-}" ]; then
  echo "$JWT_PUBLIC_KEY_B64" | base64 -d > "$PUBLIC_KEY_PATH"
  KEYS_FROM_ENV=true
elif [ -n "${JWT_PUBLIC_KEY:-}" ]; then
  printf "%b" "$JWT_PUBLIC_KEY" > "$PUBLIC_KEY_PATH"
  KEYS_FROM_ENV=true
fi

if [ -f "$PRIVATE_KEY_PATH" ]; then
  chmod 600 "$PRIVATE_KEY_PATH"
fi
if [ -f "$PUBLIC_KEY_PATH" ]; then
  chmod 644 "$PUBLIC_KEY_PATH"
fi

if [ "$KEYS_FROM_ENV" = false ]; then
  php bin/console lexik:jwt:generate-keypair --skip-if-exists || true
else
  if [ ! -f "$PRIVATE_KEY_PATH" ] || [ ! -f "$PUBLIC_KEY_PATH" ]; then
    echo "ERROR: JWT keys not found after env injection. Check JWT_PRIVATE_KEY(_B64) and JWT_PUBLIC_KEY(_B64)." >&2
    exit 1
  fi
fi

echo "Running database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction || true


echo "Starting PHP-FPM..."
php-fpm -F &
PHP_PID=$!

echo "Waiting for PHP-FPM to start..."
sleep 2

echo "Starting Nginx..."
nginx -g "daemon off;"

wait $PHP_PID
