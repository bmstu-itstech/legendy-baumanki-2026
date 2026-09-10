# syntax=docker/dockerfile:1
FROM python:3.13-slim AS base

# libpq5   — нужен psycopg (алембик-миграции и sync-режим) для связи с Postgres.
# openssl  — entrypoint.sh генерирует EC-ключи для JWT при первом запуске.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

# Зависимости — отдельным слоем, чтобы пересобирались только при
# изменении pyproject.toml/uv.lock, а не при каждой правке кода.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project --no-dev

COPY . .
RUN uv sync --locked --no-dev

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
