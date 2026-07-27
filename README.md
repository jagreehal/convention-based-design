# Contract-first design

At 09:17 on Monday, every payment in the dashboard read £0.00.

The payments producer still held the right totals. It had renamed `amount` to
`value` on Friday. The dashboard deployed from another repository and kept
reading `amount`. Both builds were green. The customer view was wrong.

Contract drift caused the failure. Copying a TypeScript type into the dashboard
would only create another stale copy. Publishing a shared package would exclude
the Python consumer and couple releases. Moving everything into one repository
would solve far more than this field mismatch required.

The smaller fix is a contract both sides can consume.

## Read the argument one proof at a time

This repository is the runnable proof. The written argument is the
[six-part series](posts/README.md), where each post ends on the question the
next one answers. Start at
[part 1: The £0.00 dashboard](posts/01-the-zero-pound-dashboard.md).

## Commit the contract

The producer already uses Zod schemas to reject invalid requests and events.
This example generates standard artifacts from those same schemas:

- OpenAPI describes request and response traffic.
- JSON Schema describes events.
- YAML frontmatter describes authored documentation.

Each publishing repository commits those artifacts at predictable paths:

```text
any-producing-repo/
  contracts/
    openapi.json
    events/*.json
  docs/
    *.md
```

The path is the convention. A consumer can fetch one file without importing the
producer's source, matching its language, or joining its release cycle.

## What the convention buys

- **A new consumer starts from one file.** The Python reporter joined the
  system by reading `payment.completed.json` and writing fifty lines of
  validation. No TypeScript toolchain, no source access, no meeting with the
  payments team.
- **Releases stay independent.** The producer ships on Friday, the dashboard
  on Tuesday. The artifact diff in the pull request is the coordination, and
  it is reviewable by both teams.
- **The broker can change without a payload migration.** Swapping the NDJSON
  file for Kafka, NATS, or SQS replaces a transport adapter. Every consumer
  keeps validating the same bytes against the same schema.
- **Drift turns into a red build instead of a production incident.** Rename a
  field and the producer's own CI names the stale artifact before a reviewer
  reads the diff, let alone before a customer reads £0.00.
- **Discovery is automatic.** The catalog and the docs index are generated
  from the well-known paths. Documenting a new service costs following the
  convention, not writing catalog pages.
- **Every repository answers the same questions in the same place.** What API
  it serves, what events it emits, who owns it, how to operate it. The tenth
  repository is as easy to learn as the first.

## Four separate repositories, shown together

Each top-level directory stands in for a separate company repository:

| Directory | Role |
|---|---|
| `payments-service/` | TypeScript producer. Zod is the runtime source of truth; `contracts/` is generated and committed. |
| `dashboard/` | TypeScript frontend. Orval generates its typed microservice client from `openapi.json`. |
| `reporter/` | Python event consumer. `jsonschema` validates each record against `contracts/events/*.json`. |
| `catalog/` | Company aggregator. EventCatalog reads committed artifacts from every configured repository. |

`docs-index.mjs` demonstrates the documentation half of the convention by
indexing frontmatter from each `docs/` directory.

The local paths keep the demonstration runnable in one checkout. With separate
repositories, CI downloads the same files from a release, artifact store, URL,
or pinned Git reference.

## Follow one schema to every consumer

```text
payments-service
  Zod request and event schemas
       |
       +-- npm run contracts --> contracts/openapi.json
       |                              |
       |                              +--> Orval --> dashboard client
       |
       +-- npm run contracts --> contracts/events/*.json
                                      |
                                      +--> NDJSON, Kafka, NATS, SQS, ...
                                                   |
                                                   +--> Python reporter validation
                                      |
                                      +--> EventCatalog pages

docs/*.md ----------------------------+--> company docs index
```

Every consumer crosses the artifact seam. None reads
`payments-service/src/`.

Event identity, version, summary, producers, and consumers travel inside each
JSON Schema through an `x-eventcatalog` extension. The catalog validates that
metadata, rejects duplicate event IDs, and rebuilds its generated domain from
scratch so retired events disappear.

The event tests use the same NDJSON serializer as the running producer. Their
approved files pin the compact bytes, field order, and record delimiter that
the reporter receives.

## Frontend to microservice type safety

The dashboard stands in for a browser frontend deployed separately from the
payments microservice. It does not import the producer's TypeScript types.
Orval reads the committed OpenAPI artifact and generates:

- typed request bodies and path parameters;
- typed success and error responses;
- a fetch client with the correct routes and HTTP methods.

The frontend typecheck fails when its calls no longer match the generated
client. The microservice still validates requests at runtime because browser
traffic, old deployments, and third-party callers do not pass through the
frontend compiler.

OpenAPI covers HTTP request and response traffic. The same artifact-first
pattern can describe WebSocket or server-sent event payloads with JSON Schema,
with AsyncAPI added when channel and protocol details also need a contract.

## One payload contract, any message transport

JSON Schema describes the event payload. Kafka, NATS, SQS/SNS, RabbitMQ,
EventBridge, Redis Streams, and the NDJSON file in this demo can all carry
those bytes.

```text
payment.completed JSON Schema
            |
            +--> Kafka topic
            +--> NATS subject
            +--> SQS queue or SNS topic
            +--> RabbitMQ exchange
            +--> EventBridge bus
            +--> NDJSON file used by ./demo.sh
```

The transport contract remains separate:

| Transport | Details outside the payload schema |
|---|---|
| Kafka | Topic, message key, partitioning, retention, delivery guarantees |
| NATS or JetStream | Subject, stream, consumer, acknowledgement policy |
| SQS/SNS | Queue or topic ARN, message attributes, redrive policy, envelope |
| RabbitMQ | Exchange, routing key, queue binding, acknowledgement policy |
| EventBridge | Bus, source, detail type, retry and archive policy |

A transport adapter unwraps broker-specific envelopes and validates the
resulting payload against the committed JSON Schema. AsyncAPI can describe
channels, bindings, and broker operations when teams need those transport
details in the catalog too. Changing brokers does not require a new payment
payload contract.

## Run the proof

```sh
(cd payments-service && npm install)
(cd dashboard && npm install)
(cd catalog && npm install)
./demo.sh
```

The script uses Node 24 and Python 3 with the `jsonschema` package, and
performs the proof in this order:

1. Typecheck the producer and compare its current schemas with the committed
   artifacts.
2. Rename `amount` to `value` temporarily and require the drift check to fail.
3. Restore the source, regenerate the dashboard client, and typecheck it.
4. Start the producer and send a request through the generated client.
5. Validate the emitted NDJSON record in Python.
6. Generate the documentation index and EventCatalog.

NDJSON keeps the proof local and brokerless. Replacing that adapter with
Kafka, NATS, or SQS changes delivery configuration, not the event schema or
the reporter's payload validation.

The cleanup trap restores the producer source and stops the server even when
the demonstration exits early. CI runs the same script, then rejects modified,
deleted, or untracked generated files.

After an intentional schema change, regenerate and commit the artifacts:

```sh
cd payments-service
npm run contracts
npm run check
```

## What each check catches

| Failure | Where it stops |
|---|---|
| Runtime schema changed, artifact unchanged | Producer artifact drift check |
| Event retired, old schema file remains | Producer file-set check |
| Event bytes or field order changed | NDJSON message contract |
| Dashboard still calls the old shape | Generated client typecheck |
| Frontend sends an invalid request at runtime | Microservice Zod validation |
| Producer emits an invalid event | Zod before append |
| Python receives an invalid event | JSON Schema validation |
| Two repositories claim the same event ID | Catalog generation |
| Generated output was not committed | Final CI working-tree check |

## When a monorepo still wins

A monorepo remains useful when one team releases tightly coupled packages as
one product. It offers atomic changes, shared tooling, and one dependency
graph.

This pattern addresses a narrower problem: independent producers and consumers
need an explicit, versioned description of what crosses between them. OpenAPI
and JSON Schema keep that description usable from TypeScript, Python, Go, Rust,
or the JVM.

The Friday rename now gets two outcomes. An intentional change produces an
artifact diff for review. An accidental change turns CI red before Monday
morning, whether the value is heading to a browser over HTTP or to a consumer
through Kafka, NATS, or SQS. The dashboard never gets the chance to print
£0.00.
