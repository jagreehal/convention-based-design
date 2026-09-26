---
title: "Convention-based artifact publishing, part 3: One event, two languages"
series: convention-based-design
part: 3
---

# One event, two languages

The reporter that sends finance its daily totals is fifty lines of Python. It
cannot import the generated client from part 2, and it cannot run a Zod schema.
The data platform team does not have Node installed and has no intention of
installing it.

They still need to know what a `payment.completed` event looks like.

## Validate at both ends, for different reasons

The TypeScript producer defines the event with Zod and parses each value
through that schema before writing it. The same schema generates a file:

```text
contracts/events/payment.completed.json
```

The reporter loads that committed JSON with `jsonschema`, picks the validator
by event type, and checks the record before touching `payment.amount`.

Two checks, and they catch different things. The producer's check stops a known
bad event leaving the module. The reporter's check catches a stale deployment
still emitting last month's shape, a corrupted record, and a producer that
ignored the contract.

Nothing sits between them at runtime. No shared package, no client library, no
version to coordinate.

## Inspect the bytes that cross the boundary

A schema describes the values it permits. It says nothing about what lands on
the wire, and consumers parsing a stream care about that too.

The producer and its tests share one NDJSON serializer. Approved files expose
changes to encoding, record delimiters, and the serialized example in the pull
request. JSON object member order has no semantic meaning, so consumers must not
depend on it even though the byte snapshot makes an order change visible.

Here is the record that crosses from Node to Python when you run the demo:

```json
{"type":"payment.completed","payment":{"id":"...","amount":42,"currency":"GBP","status":"completed","createdAt":"..."},"settledAt":"..."}
```

JSON Schema accepts the record before the reporter prints
`OK payment.completed 42 GBP`.

That is a language-neutral event contract, delivered by writing to a file on
disk. Real systems use Kafka, NATS, or SQS, and each adds its own
envelope, its own keys, and its own delivery semantics.

[← Part 2](02-a-typed-frontend-without-backend-source.md) ·
[Part 4: One payload across brokers →](04-one-payload-any-broker.md)
