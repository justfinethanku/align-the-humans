#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source .cursor/runtime.sh
exec npm run dev -- --hostname 0.0.0.0 --port "${PORT:-3000}"
