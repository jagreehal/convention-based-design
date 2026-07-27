---
title: "Contract-first design, part 4: One payload, any broker"
series: contract-first-design
part: 4
---

# One payload, any broker

The Python reporter from part 3 reads NDJSON. Replace that file with Kafka and
the `payment.completed` payload does not gain a partition key. Replace Kafka
with SQS and the payment does not gain a redrive policy.

Those facts belong to different contracts.

## Payload and transport

JSON Schema owns the payload:

```text
type
payment.id
payment.amount
payment.currency
settledAt
```

The transport owns delivery:

| Transport | Delivery contract |
|---|---|
| Kafka | Topic, key, partitioning, retention, delivery guarantees |
| NATS or JetStream | Subject, stream, durable consumer, acknowledgement |
| SQS/SNS | Queue or topic ARN, attributes, envelope, redrive policy |
| RabbitMQ | Exchange, routing key, binding, acknowledgement |
| EventBridge | Bus, source, detail type, retries, archive |

A small adapter handles the seam:

```text
broker envelope
  -> transport adapter
  -> payment.completed payload
  -> JSON Schema validation
  -> consumer logic
```

An SNS notification delivered through SQS may wrap the event body. EventBridge
places it under `detail`. A Kafka consumer receives bytes plus headers and a
key. Each adapter removes that transport-specific structure before the same
payload validator runs.

## Where AsyncAPI fits

JSON Schema answers, “What is inside this event?” AsyncAPI can answer, “Where is
it published, which protocol carries it, and what operation does a consumer
perform?”

Teams can commit both:

```text
contracts/
  asyncapi.json
  events/payment.completed.json
```

The event schema stays useful even when the broker changes. The AsyncAPI
artifact records the transport topology when that information needs the same
review and discovery workflow.

The local demo uses NDJSON because it starts in one command and needs no broker.
Its contract is still the payload a Kafka, NATS, SQS, RabbitMQ, or EventBridge
adapter would carry.

One producer and one consumer can now agree across languages and transports.
The next problem appears when a company has hundreds of repositories: how does
anyone find the contracts?

[← Part 3](03-one-event-two-languages.md) ·
[Part 5: Turn repository conventions into a catalog →](05-turn-repositories-into-a-catalog.md)
