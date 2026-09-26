---
title: "Convention-based artifact publishing, part 4: One payload across brokers"
series: convention-based-design
part: 4
---

# One payload across brokers

Swap the NDJSON file for Kafka and `payment.completed` does not grow a
partition key. Swap Kafka for SQS and it does not grow a redrive policy.

Those things are real, and they belong to a different agreement than the one
describing what a payment is.

## Payload and delivery contracts

JSON Schema owns the payload:

```text
type
payment.id
payment.amount
payment.currency
settledAt
```

The broker owns delivery:

| Transport | Delivery contract |
|---|---|
| Kafka | Topic, key, partitioning, retention, delivery guarantees |
| NATS or JetStream | Subject, stream, durable consumer, acknowledgement |
| SQS/SNS | Queue or topic ARN, attributes, envelope, redrive policy |
| RabbitMQ | Exchange, routing key, binding, acknowledgement |
| EventBridge | Bus, source, detail type, retries, archive |

A small adapter sits on the seam:

```text
broker envelope
  -> transport adapter
  -> payment.completed payload
  -> JSON Schema validation
  -> consumer logic
```

An SNS notification arriving through SQS wraps the body in another JSON string.
EventBridge buries it under `detail`. A Kafka consumer gets bytes plus headers
plus a key. Each adapter strips its own broker's packaging and hands the same
payload to the same validator.

Migrating from SQS to Kafka rewrites one adapter per consumer and changes
operational behaviour such as ordering, retries, and deduplication. The payload
schema and its validation code can remain unchanged when the business event
keeps the same shape.

## AsyncAPI covers transport topology

JSON Schema answers what is inside the event. AsyncAPI answers where it gets
published, which protocol carries it, and what operation a consumer performs.

Commit both when the transport topology deserves the same review and discovery
as the payload:

```text
contracts/
  asyncapi.json
  events/payment.completed.json
```

The demo stays on NDJSON because it starts in one command and needs no broker
running. The bytes it moves are the bytes a Kafka adapter would carry.

One producer and one consumer now agree across two languages while transport
adapters handle broker semantics. The next problem appears as the repository
count grows: a new consumer cannot find a contract it does not know exists.

[← Part 3](03-one-event-two-languages.md) ·
[Part 5: Turn repository conventions into a catalog →](05-turn-repositories-into-a-catalog.md)
