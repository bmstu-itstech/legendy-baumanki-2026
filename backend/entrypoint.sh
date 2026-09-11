#!/usr/bin/env sh
set -e

echo "Running migrations..."
alembic upgrade head

echo "Starting..."
if [ "${UVICORN_RELOAD:-false}" = "true" ]; then
  exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
  exec uvicorn main:app --host 0.0.0.0 --port 8000
fi
