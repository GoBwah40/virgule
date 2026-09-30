#!/usr/bin/env bash
# Préproduction locale : le build de production, servi sur http://localhost:3001 et branché
# sur la base Turso `virgule-preview`. Même code qu'en ligne, sans toucher à la production.
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=.env.preview.local
if [ ! -f "$ENV_FILE" ]; then
  echo "preprod : $ENV_FILE introuvable (URL et jeton de la base virgule-preview, voir README)." >&2
  exit 1
fi

set -a
. "./$ENV_FILE"
set +a
: "${TURSO_DATABASE_URL:?preprod : TURSO_DATABASE_URL manque dans $ENV_FILE}"

# `next build` et `next start` chargent aussi .env.production.local (valeurs de production), mais
# ne remplacent jamais une variable déjà définie, même vide : on fixe ici toutes celles qui
# pourraient pointer vers la production. Sans Pusher, l'app se synchronise par polling.
export TURSO_AUTH_TOKEN="${TURSO_AUTH_TOKEN:-}"
export DATABASE_URL="${DATABASE_URL:-}"
export CRON_SECRET="${CRON_SECRET:-}"
export PUSHER_APP_ID="${PUSHER_APP_ID:-}"
export PUSHER_SECRET="${PUSHER_SECRET:-}"
export NEXT_PUBLIC_PUSHER_KEY="${NEXT_PUBLIC_PUSHER_KEY:-}"
export NEXT_PUBLIC_PUSHER_CLUSTER="${NEXT_PUBLIC_PUSHER_CLUSTER:-eu}"

echo "preprod : base $TURSO_DATABASE_URL"
pnpm build
exec pnpm exec next start --port "${PORT:-3001}"
