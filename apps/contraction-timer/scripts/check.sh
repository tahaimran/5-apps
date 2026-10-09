#!/usr/bin/env bash
# The gate before every commit (CLAUDE.md rule 10). It stops at the first failure: `set -e` makes a
# non-zero Jest exit abort the script, and nothing here is piped into a command that hides the status.
#   npm run check && git commit ...
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== tsc (app)";    npx tsc --noEmit
echo "== tsc (shared)"; (cd ../../packages/shared && npx tsc --noEmit)
echo "== jest";         npx jest
echo "== expo-doctor";  npx expo-doctor
echo "== expo export";  npx expo export --platform android --output-dir "${TMPDIR:-/tmp}/ct-export"
echo "== all checks passed"
