#!/usr/bin/env bash
# Cloud Agent install script for Human Alignment (Next.js 14 + Supabase).
# Idempotent: installs dependencies and regenerates .env.local from the
# environment variables (Cloud Agent secrets) that are present.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing dependencies (npm ci)"
npm ci

# Generate .env.local from injected environment variables.
# Only variables that are set are written; the app reads these at runtime.
ENV_FILE=".env.local"
echo "==> Writing $ENV_FILE from available environment variables"
: > "$ENV_FILE"

write_var() {
  local key="$1"
  local value="${!key:-}"
  if [ -n "$value" ]; then
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

write_var NEXT_PUBLIC_SUPABASE_URL
write_var NEXT_PUBLIC_SUPABASE_ANON_KEY
write_var SUPABASE_SERVICE_ROLE_KEY
write_var OPEN_ROUTER_API_KEY
write_var AI_GATEWAY_API_KEY
write_var RESEND_API_KEY
write_var INVITE_TOKEN_SECRET
write_var SUPABASE_AUTH_HOOK_SECRET

# App URL defaults to localhost for the dev server when not provided.
printf 'NEXT_PUBLIC_APP_URL=%s\n' "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}" >> "$ENV_FILE"

echo "==> .env.local written with the following keys:"
sed 's/=.*/=<set>/' "$ENV_FILE"

echo "==> Install complete"
