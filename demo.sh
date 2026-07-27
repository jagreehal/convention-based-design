#!/usr/bin/env bash
# End-to-end proof: contracts stay in sync, both consumers work, catalog aggregates.
set -euo pipefail
cd "$(dirname "$0")"

echo "── payments-service: emit contracts + drift check"
(cd payments-service && npm run --silent contracts && npm run --silent check)

echo "── dashboard: regenerate typed client from openapi.json + typecheck"
(cd dashboard && npm run --silent generate >/dev/null && npm run --silent check)

echo "── live round-trip: server ← typed client, events → python"
rm -f payments-service/events.ndjson
(cd payments-service && exec node src/server.ts) &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1
(cd dashboard && npm run --silent start)
python3 reporter/reporter.py --check
python3 reporter/reporter.py

echo "── catalog: aggregate every repo's contracts"
(cd catalog && npm run --silent generate >/dev/null && echo "catalog generated — run 'npm run dev' in catalog/ to browse")

echo "✅ all green"
