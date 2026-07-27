#!/usr/bin/env bash
# End-to-end proof: contracts stay in sync, both consumers work, catalog aggregates.
set -euo pipefail
cd "$(dirname "$0")"

API=payments-service/src/api.ts
cleanup() {
  [ -f "$API.orig" ] && mv -f "$API.orig" "$API"
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "── payments-service: drift check against COMMITTED contracts (CI semantics)"
(cd payments-service && npm run --silent check)

echo "── drift demo: rename 'amount' in the producer schema, watch the check fail"
cp "$API" "$API.orig"
python3 -c "import pathlib, sys; p = pathlib.Path(sys.argv[1]); p.write_text(p.read_text().replace('amount', 'value'))" "$API"
if (cd payments-service && npm run --silent check >/dev/null 2>&1); then
  echo "✗ drift NOT caught — check is broken"; exit 1
fi
mv -f "$API.orig" "$API"
echo "caught: contracts stale after schema change (CI would fail here)"
(cd payments-service && npm run --silent check >/dev/null)

echo "── dashboard: regenerate typed client from openapi.json + typecheck"
(cd dashboard && npm run --silent generate >/dev/null && npm run --silent check)

echo "── live round-trip: server ← typed client, events → python"
rm -f payments-service/events.ndjson
(cd payments-service && exec node src/server.ts) &
SERVER_PID=$!
sleep 1
(cd dashboard && npm run --silent start)
python3 reporter/reporter.py --check
python3 reporter/reporter.py

echo "── docs: aggregate agreed frontmatter across repos"
node docs-index.mjs

echo "── catalog: aggregate every repo's contracts"
(cd catalog && npm run --silent check && npm run --silent generate >/dev/null && echo "catalog generated — run 'npm run dev' in catalog/ to browse")

echo "✅ all green"
