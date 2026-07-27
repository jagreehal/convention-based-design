---
title: Payments service runbook
repo: payments-service
owner: payments-platform
tags: [runbook, payments]
---

## Payment stuck in processing

Check `events.ndjson` for a `payment.completed` event with the payment id.
No event within 5 minutes means the settle step died: restart the service and
replay from the last event.

## Reporter shows INVALID events

The service is emitting off-contract. `npm run check` in this repo will name
the drifted schema; regenerate contracts and ship a versioned event instead.
