---
title: "Contract-first design, part 3: One event, two languages"
series: contract-first-design
part: 3
---

# One event, two languages

The frontend could generate TypeScript from OpenAPI. The reporter cannot import
that client or the producer's Zod schemas because it runs in Python.

JSON Schema gives both runtimes a common interface.

## Validate before and after delivery

The TypeScript producer defines `payment.completed` with Zod. Before it writes
an event, it parses the value through that schema. The same schema generates:

```text
contracts/events/payment.completed.json
```

The Python reporter loads that committed JSON file with `jsonschema`. For each
record it selects the schema by event type and validates the payload before
reading `payment.amount`.

Validation happens at both ends for different reasons:

- Producer validation prevents known bad events from leaving the module.
- Consumer validation detects stale deployments, corrupt records, and
  producers that did not follow the contract.

No shared runtime package sits between them.

## Pin the bytes as well as the shape

A schema describes allowed values. Consumers can also care about the concrete
serialization placed on the wire.

The producer and its tests share one NDJSON serializer. Approved files pin the
compact JSON, field order, and newline delimiter. A serialization change
therefore appears as a normal code review diff.

The repository's live proof sends this record from Node to Python:

```json
{"type":"payment.completed","payment":{"id":"...","amount":42,"currency":"GBP","status":"completed","createdAt":"..."},"settledAt":"..."}
```

The reporter prints `OK payment.completed 42 GBP` only after JSON Schema accepts
it.

We now have a language-neutral event contract, but the demo delivers it through
a file. Production systems use Kafka, NATS, SQS, RabbitMQ, and other brokers.
Does choosing one of them change the payload agreement?

[← Part 2](02-a-typed-frontend-without-backend-source.md) ·
[Part 4: One payload, any broker →](04-one-payload-any-broker.md)
