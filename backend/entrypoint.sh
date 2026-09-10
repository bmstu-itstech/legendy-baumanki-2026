#!/usr/bin/env sh
set -e

PRIVATE_KEY_PATH="${JWT_PRIVATE_KEY_PATH:-./secrets/ec_private.pem}"
PUBLIC_KEY_PATH="${JWT_PUBLIC_KEY_PATH:-./secrets/ec_public.pem}"

# EC-ключи для подписи JWT. secrets/ монтируется как volume, поэтому
# ключи генерируются один раз и переживают пересоздание контейнера —
# без этого токены, выданные до рестарта, переставали бы проверяться.
if [ ! -f "$PRIVATE_KEY_PATH" ] || [ ! -f "$PUBLIC_KEY_PATH" ]; then
  echo "Generating JWT EC keypair at $PRIVATE_KEY_PATH..."
  mkdir -p "$(dirname "$PRIVATE_KEY_PATH")"
  openssl ecparam -name prime256v1 -genkey -noout -out "$PRIVATE_KEY_PATH"
  openssl ec -in "$PRIVATE_KEY_PATH" -pubout -out "$PUBLIC_KEY_PATH" 2>/dev/null
fi

echo "Running migrations..."
alembic upgrade head

echo "Starting..."
if [ "${UVICORN_RELOAD:-false}" = "true" ]; then
  exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
  exec uvicorn main:app --host 0.0.0.0 --port 8000
fi
