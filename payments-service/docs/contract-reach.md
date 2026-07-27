---
title: One contract from browser to broker
repo: payments-service
owner: payments-platform
tags: [architecture, contracts, frontend, messaging]
---

# One contract from browser to broker

At 09:17 on Monday, the dashboard displayed £0.00 for a payment that had
settled for £42. The producer had renamed `amount` to `value`; the frontend
still read yesterday's shape.

That failure and a malformed event on a queue share one cause: a producer and
consumer disagree about the data crossing between them.

## The HTTP path

The payments microservice generates `contracts/openapi.json` from the Zod
schemas it uses at runtime. A separately deployed frontend feeds that artifact
to Orval and receives a typed fetch client. The frontend compiler now knows the
request body, response body, error shapes, routes, and HTTP methods without
importing backend source.

The compiler protects code written against the generated client. The
microservice still validates each live request because browsers and older
deployments can send values the current frontend would reject.

## The event path

The same producer writes JSON Schemas to `contracts/events/`. A consumer
validates the payload after its transport adapter removes the delivery
envelope.

The adapter might read from a Kafka topic, subscribe to a NATS subject, poll an
SQS queue, bind a RabbitMQ routing key, or receive an EventBridge event. Those
systems disagree about routing, acknowledgements, retries, and envelopes. They
can still carry the same `payment.completed` payload.

```text
broker envelope -> transport adapter -> payment.completed payload -> JSON Schema
```

JSON Schema owns the payload contract. Broker configuration owns delivery.
AsyncAPI can record channels and protocol bindings when the delivery contract
also needs to be published.

## The result

The frontend and event consumers use different generators, runtimes, and
transports. They agree because each consumes a committed artifact rather than
a copy of the producer's code.

The next `amount` to `value` rename stops in CI. It never reaches the browser,
and it never matters whether the event was waiting in Kafka, NATS, or SQS.
