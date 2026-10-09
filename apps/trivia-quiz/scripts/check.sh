#!/usr/bin/env bash
# The pre-commit gate: every step must pass or the whole script exits non-zero (set -e), so
#   npm run check && git commit ...
# never commits on a failing test. Do not pipe jest into tail/head here: that hides its exit status.
set -euo pipefail
cd "$(dirname "$0")/.."
npx tsc --noEmit
(cd ../../packages/shared && npx tsc --noEmit)
npx jest
npx expo-doctor
npx expo export --platform android --output-dir "${TMPDIR:-/tmp}/tq-export"
