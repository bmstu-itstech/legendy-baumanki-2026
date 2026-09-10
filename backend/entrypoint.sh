#!/usr/bin/env sh
set -e

echo "Starting..."
exec uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
