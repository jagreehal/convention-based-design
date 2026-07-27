---
title: Payments service runbook
repo: payments-service
owner: payments-platform
tags: [runbook, payments]
---

## Payment stuck in processing

The local demonstration writes to `events.ndjson`. Check it for a
`payment.completed` event with the payment id. A deployed adapter should check
the configured Kafka topic, NATS subject, SQS queue, or equivalent destination.

No event within 5 minutes means the settle step or transport adapter died.
Restart the failed module and replay from the last acknowledged event.

## Reporter shows INVALID events

First remove any broker envelope and inspect the event payload. The payload is
off-contract when JSON Schema validation still fails after unwrapping.
`npm run check` in this repo will name a drifted schema; regenerate contracts
and ship a versioned event instead.

## Dashboard request fails

Regenerate the frontend client from `contracts/openapi.json` and run its
typecheck. If the generated client compiles but the live request fails, compare
the deployed microservice version with the OpenAPI artifact used by the
frontend build.
