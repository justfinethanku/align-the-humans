#!/usr/bin/env bash
# Public preview only. Stateful tests use the isolated local Supabase stack.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source .cursor/runtime.sh
# Explicit values override inherited environment and any existing dotenv file.
export NEXT_PUBLIC_SUPABASE_URL='https://placeholder.supabase.co'
export NEXT_PUBLIC_SUPABASE_ANON_KEY='public-anon-key-placeholder'
export SUPABASE_SERVICE_ROLE_KEY='service-role-placeholder'
export INVITE_TOKEN_SECRET='invite-token-placeholder'
export OPEN_ROUTER_API_KEY='' OPENROUTER_API_KEY='' AI_GATEWAY_API_KEY=''
export RESEND_API_KEY='' SUPABASE_AUTH_HOOK_SECRET='' OPS_ALERT_EMAIL=''
exec npm run dev -- --hostname 0.0.0.0 --port "${PORT:-3000}"
