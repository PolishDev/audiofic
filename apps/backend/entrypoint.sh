#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[AudioFic Backend] RUN_MIGRATIONS=true detectado. Executando migrações do banco de dados..."
  if [ -f "./node_modules/.bin/drizzle-kit" ]; then
    ./node_modules/.bin/drizzle-kit migrate
  elif [ -f "../../node_modules/.bin/drizzle-kit" ]; then
    ../../node_modules/.bin/drizzle-kit migrate
  else
    npx drizzle-kit migrate
  fi
  echo "[AudioFic Backend] Migrações finalizadas com sucesso."
fi

exec "$@"
