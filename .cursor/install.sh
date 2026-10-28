#!/usr/bin/env bash
# Cursor runs this finite, repeatable step during a Build, from the repo root.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.."
version="$(tr -d '[:space:]' < .nvmrc)"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  source "$NVM_DIR/nvm.sh"
  nvm install --no-progress "$version"
  nvm alias default "$version"
elif [[ "$(node --version 2>/dev/null || true)" != "v$version" ]]; then
  # The standard Cursor base may change. Bootstrap the official binary if nvm
  # is absent, rather than depending on a previous snapshot's installed Node.
  [[ "$(uname -s)-$(uname -m)" == "Linux-x86_64" ]] || {
    echo 'The binary bootstrap is for Cursor-hosted Linux x64. Use nvm elsewhere.' >&2
    exit 1
  }
  archive="node-v$version-linux-x64.tar.xz"
  scratch="$(mktemp -d)"
  trap 'rm -rf -- "$scratch"' EXIT
  curl --fail --silent --show-error --location --retry 3 \
    "https://nodejs.org/dist/v$version/$archive" -o "$scratch/$archive"
  curl --fail --silent --show-error --location --retry 3 \
    "https://nodejs.org/dist/v$version/SHASUMS256.txt" -o "$scratch/SHASUMS256.txt"
  (cd "$scratch" && awk -v file="$archive" '$2 == file' SHASUMS256.txt | sha256sum --check --status)
  if [[ -w /usr/local ]]; then
    tar -xJf "$scratch/$archive" -C /usr/local --strip-components=1
  else
    sudo tar -xJf "$scratch/$archive" -C /usr/local --strip-components=1
  fi
fi
source .cursor/runtime.sh
node --version
npm --version
npm ci --no-audit --no-fund

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
# Canonical OpenRouter name. The app also accepts OPENROUTER_API_KEY as a fallback.
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
