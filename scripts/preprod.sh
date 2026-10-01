#!/usr/bin/env bash
# Local preprod: the production build, served on http://localhost:3001 and connected
# to the `virgule-preview` Turso database. Same code as live, without touching production.
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=.env.preview.local
if [ ! -f "$ENV_FILE" ]; then
  echo "preprod: $ENV_FILE not found (URL and token of the virgule-preview database, see README)." >&2
  exit 1
fi

set -a
. "./$ENV_FILE"
set +a
: "${TURSO_DATABASE_URL:?preprod: TURSO_DATABASE_URL missing from $ENV_FILE}"

# `next build` and `next start` also load .env.production.local (production values), but
# never override a variable that is already set, even if empty: so we set here every one that
# could point to production. Without Pusher, the app syncs by polling; without Upstash,
# nothing is rate limited.
export TURSO_AUTH_TOKEN="${TURSO_AUTH_TOKEN:-}"
export DATABASE_URL="${DATABASE_URL:-}"
export CRON_SECRET="${CRON_SECRET:-}"
export PUSHER_APP_ID="${PUSHER_APP_ID:-}"
export PUSHER_SECRET="${PUSHER_SECRET:-}"
export NEXT_PUBLIC_PUSHER_KEY="${NEXT_PUBLIC_PUSHER_KEY:-}"
export NEXT_PUBLIC_PUSHER_CLUSTER="${NEXT_PUBLIC_PUSHER_CLUSTER:-eu}"
export UPSTASH_REDIS_REST_URL="${UPSTASH_REDIS_REST_URL:-}"
export UPSTASH_REDIS_REST_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-}"

echo "preprod: database $TURSO_DATABASE_URL"
pnpm build
exec pnpm exec next start --port "${PORT:-3001}"
