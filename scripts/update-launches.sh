#!/usr/bin/env bash
#
# Calls the update-launches cron endpoint, which advances project launch
# statuses (SCHEDULED -> ONGOING -> LAUNCHED) and expires abandoned payments.
#
# Referenced by:
#   package.json   -> "update-launches"
#   vercel.json    -> cron "/api/cron/update-launches"
#   docs/cron-launches.md
#
# Environment:
#   CRON_API_KEY  Bearer token the route checks. Required.
#   APP_URL       Base URL of the running app. Defaults to http://localhost:3000.
#
# Exits non-zero if the endpoint does not answer with 2xx, so a scheduler can
# detect the failure instead of silently succeeding.

set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"

if [ -z "${CRON_API_KEY:-}" ]; then
  echo "update-launches: CRON_API_KEY is not set" >&2
  exit 1
fi

endpoint="${APP_URL%/}/api/cron/update-launches"

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

status="$(
  curl --silent --show-error --location \
    --max-time 120 \
    --output "$response_file" \
    --write-out '%{http_code}' \
    --header "Authorization: Bearer ${CRON_API_KEY}" \
    --header 'Content-Type: application/json' \
    "$endpoint"
)"

cat "$response_file"
echo

if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
  echo "update-launches: ${endpoint} returned HTTP ${status}" >&2
  exit 1
fi
