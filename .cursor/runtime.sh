#!/usr/bin/env bash
# Source this file when a non-interactive shell has not loaded the pinned runtime.
ath_repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ath_node_version="$(tr -d '[:space:]' < "$ath_repo_root/.nvmrc")"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # nvm is a shell function, so merely putting it on PATH is insufficient.
  source "$NVM_DIR/nvm.sh"
  nvm use --silent "$ath_node_version" >/dev/null || return 1
  # Cursor may put /exec-daemon/node before nvm's existing PATH entry.
  export PATH="$(dirname -- "$(nvm which "$ath_node_version")"):$PATH"
else
  export PATH="/usr/local/bin:$PATH"
fi
if [[ "$(node --version)" != "v$ath_node_version" ]]; then
  printf 'ATH needs Node %s. Run bash .cursor/install.sh first.\n' "$ath_node_version" >&2
  return 1
fi
