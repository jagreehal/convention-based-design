# Contract-first design: the series

At 09:17 on Monday, a dashboard turned every payment into £0.00. Six posts
follow that field from one broken frontend to a contract system that works
across repositories, languages, and message transports.

Read them in order. Each post answers the question raised by the one before it.

1. [The £0.00 dashboard](01-the-zero-pound-dashboard.md)  
   Why copied types and green builds still allow contract drift.
2. [A typed frontend without backend source](02-a-typed-frontend-without-backend-source.md)  
   How OpenAPI becomes a generated client for a separately deployed frontend.
3. [One event, two languages](03-one-event-two-languages.md)  
   How JSON Schema connects a TypeScript producer to a Python consumer.
4. [One payload, any broker](04-one-payload-any-broker.md)  
   Where Kafka, NATS, SQS, RabbitMQ, and EventBridge fit.
5. [Turn repository conventions into a catalog](05-turn-repositories-into-a-catalog.md)  
   How well-known paths create organization-wide discovery.
6. [Make contract changes fail safely](06-make-contract-changes-fail-safely.md)  
   How drift checks, wire snapshots, retirement, and versioning close the loop.

The runnable proof lives in the repository root:

```sh
./demo.sh
```
