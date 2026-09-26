# Convention-based artifact publishing

A polyrepo pattern for repository-owned contracts and documentation. Six
GitHub repositories run it.

At 02:40 on Sunday, an on-call engineer asked an assistant how to replay a
stuck payment and settled four hundred payments twice. The correct runbook was
committed in the payments repository, updated eight weeks earlier. The
assistant had read a Confluence page from 2023 instead.

Confluence gave the assistant two answers and no way to identify the authority.
The current runbook lived beside the service. The stale page still ranked well
enough to cause an incident.

Six repositories test an agreement about where teams publish shared
information. A repository uses one or both of two standard roots:

```text
any-publishing-repo/
  contracts/          generated, committed, language-neutral
  docs/               authored, committed, frontmatter-validated
```

Four rules define the pattern:

1. The team that owns the source also owns the published artifact.
2. Consumers read committed artifacts. They do not import producer source.
3. Source CI validates the files that the repository publishes.
4. Central indexes read the standard paths without becoming build or runtime
   dependencies of the publishers.

[`cbd-docs-site`](https://github.com/jagreehal/cbd-docs-site) turns the
`docs/` roots into [one reading surface](https://jagreehal.github.io/cbd-docs-site/)
for operational and technical documentation. Teams keep authorship in git.
Readers get a company index.

[`cbd-handbook`](https://github.com/jagreehal/cbd-handbook) is the company-wide publisher:
incident policy, repository layout, and the JSON Schema that each repo's
frontmatter must satisfy. Engineering repositories publish runbooks beside the
code they describe. Customer operations publishes policy in the same shape.

At 09:17 on Monday a machine contract failed at the same ownership seam. The
producer renamed `amount` to `value`, the dashboard kept reading `amount`, both
builds were green, and each payment showed £0.00. The machine half uses the
`contracts/` root. It shows how engineering teams can apply the publishing
convention to OpenAPI and JSON Schema.

## The six repositories

| Repository | Role | Reads from other repos |
|---|---|---|
| [cbd-handbook](https://github.com/jagreehal/cbd-handbook) | Owns the convention: docs frontmatter JSON Schema, the reusable docs check workflow, company policy | nothing |
| [cbd-payments-service](https://github.com/jagreehal/cbd-payments-service) | TypeScript producer. Zod generates `contracts/openapi.json` and `contracts/events/*.json` | handbook's docs check |
| [cbd-dashboard](https://github.com/jagreehal/cbd-dashboard) | TypeScript frontend. Orval generates its client from the payments OpenAPI | `openapi.json` at a pinned tag |
| [cbd-reporter](https://github.com/jagreehal/cbd-reporter) | Python consumer. `jsonschema` validates events; its own docs check in Python | event schemas and frontmatter schema at pinned tags |
| [cbd-docs-site](https://github.com/jagreehal/cbd-docs-site) | Aggregator: [docs index](https://jagreehal.github.io/cbd-docs-site/), `llms.txt`, `.md` routes, [manifest](https://jagreehal.github.io/cbd-docs-site/contracts/docs-manifest.json) | every enrolled repo's `docs/` |
| [cbd-catalog](https://github.com/jagreehal/cbd-catalog) | Aggregator: [EventCatalog](https://jagreehal.github.io/cbd-catalog/) | every enrolled repo's `contracts/` and `docs/` |

Consumers fetch committed artifacts over HTTPS at a git tag, for example
`raw.githubusercontent.com/jagreehal/cbd-payments-service/v1.0.0/contracts/openapi.json`.
They import no source from another repository and share no package with it. To
adopt a new contract, a consumer opens a one-line pull request that bumps the
tag.

To enrol a repository, add the `cbd-publisher` GitHub topic. On each build the
aggregators list repositories with that topic, clone them, and read the
standard paths. Publishers edit no central file and build without the
aggregators.

## Watch it fail in the right place

I left four pull requests open as exhibits. In each, a change passes in the
repository that makes it and fails in the repository it would break.

| Pull request | CI | What it shows |
|---|---|---|
| [cbd-payments-service#1](https://github.com/jagreehal/cbd-payments-service/pull/1) rename `amount` to `value`, tagged `v2.0.0-beta.1` | green | Source, tests, snapshot, and contracts agree. The producer has no view of who reads `amount`. |
| [cbd-dashboard#1](https://github.com/jagreehal/cbd-dashboard/pull/1) bump pin to `v2.0.0-beta.1` | red | `tsc`: `'amount' does not exist in type 'CreatePaymentBody'`. The dashboard team sees the £0.00 bug before merge. |
| [cbd-reporter#1](https://github.com/jagreehal/cbd-reporter/pull/1) bump pin to `v2.0.0-beta.1` | red | The pinned JSON Schema rejects the event the Python reporter reads. |
| [cbd-payments-service#2](https://github.com/jagreehal/cbd-payments-service/pull/2) delete `docs/contract-reach.md` | red | `✗ cbd-payments-service/contract-reach no longer exists but is linked from cbd-dashboard/reading-the-contract, cbd-reporter/validating-events-in-python` |

The payments repository has no record of who links to its docs. Its check
reads the manifest that cbd-docs-site publishes, and that manifest names both
inbound links.

## Read the argument one proof at a time

The six repositories are the runnable proof. The written argument is the
[eight-part series](posts/README.md). Parts 1 to 6 cover machine contracts.
Parts 7 and 8 cover the repository-owned documentation index. Start at
[part 7: The 02:40 runbook](posts/07-the-two-forty-runbook.md) if the wiki is
why you are here, or
[part 1: The £0.00 dashboard](posts/01-the-zero-pound-dashboard.md) to follow
the series in order.

## Company documentation, one index

Files under `docs/` open with frontmatter validated against
`cbd-handbook`'s `contracts/docs-frontmatter.json`, a JSON Schema generated from
Zod and read by TypeScript with `z.fromJSONSchema` and by Python with
`jsonschema`. The schema requires `title` and `owner`. The aggregator derives the
last-change date from Git because a hand-written date can rot with the document.

Documents declare cross-repository edges instead of linking through sibling
filesystem paths:

```yaml
related: [cbd-payments-service/runbook, cbd-reporter/daily-settlement-report]
```

A relative link into another repository is a dead link on GitHub and in any
clone. The checker rejects it.

`cbd-docs-site` aggregates each enrolled repository's `docs/**/*.md` into
rendered pages, raw markdown at `<url>.md`, `llms.txt`, and
`contracts/docs-manifest.json` so each repository can see who links to it. The
02:40 path is concrete here:
[incident policy](https://jagreehal.github.io/cbd-docs-site/cbd-handbook/incident-communications/)
in `cbd-handbook` points at the
[payments runbook](https://jagreehal.github.io/cbd-docs-site/cbd-payments-service/runbook/),
and the site turns that declaration into a working link with a git date.

## Machine artifacts under `contracts/`

The producer uses Zod schemas to reject invalid requests and events.
Its event declarations use the published
[`eventcatalog-generator-zod`](https://www.npmjs.com/package/eventcatalog-generator-zod)
package to attach identity, version, ownership, producer, and consumer metadata
without changing Zod's inferred types or runtime validation. This example
generates standard artifacts from those same schemas:

- OpenAPI describes request and response traffic.
- JSON Schema describes events.

The standard root lets a consumer fetch one file without importing the
producer's source, matching its language, or joining its release cycle.

## Guarantees and production responsibilities

The proof draws four boundaries that adoption plans need to preserve:

| Concern | Guarantee in these repositories | Production work outside the proof |
|---|---|---|
| Source to artifact | CI fails when source and committed artifacts differ; consumers pin git tags | Protect release tags; publish to an artifact store if raw git URLs are not acceptable |
| Consumer code | Generated clients and runtime validators consume neutral artifacts | Test compatibility and coordinate breaking changes |
| Documentation structure | CI validates ownership, metadata, and links | Review whether the instructions remain correct |
| Discovery | Rebuildable indexes find publishers by GitHub topic and read standard paths | Read tokens for private repositories, rebuild on merge rather than hourly |

Git supplies an auditable last-change date. It cannot prove that a runbook still
works. OpenAPI exposes a breaking diff. It cannot order two independent
deployments. Teams still need review policy, compatibility rules, and staged
rollouts. The convention gives those decisions one inspectable place to land.

## Value

- **Operational and technical documentation has one authority.** Teams write in
  their own repositories. One job builds the company index. Readers can identify
  the owner and last change without choosing between wiki copies.
- **Company documentation uses the same artifact shape.** `cbd-handbook`
  holds incident communications and the frontmatter schema. Teams without a Git
  workflow still need an editor or export path that produces these files.
- **A new consumer starts from one file.** The Python reporter joined the
  system by reading `payment.completed.json` and writing fifty lines of
  validation. No TypeScript toolchain, no source access, no meeting with the
  payments team.
- **Teams keep separate release schedules.** Consumers pin published artifacts
  and upgrade on their schedule. Breaking changes still require version overlap
  and rollout coordination.
- **Payload validation survives a broker change.** A new transport requires a
  new adapter and may change ordering or delivery behaviour. Consumers can keep
  the same JSON Schema for an unchanged payload.
- **Source drift and known broken links fail in CI.** The checks catch stale
  generated artifacts and links recorded in the latest manifest before those
  changes merge.
- **Discovery needs no per-document registration.** The documentation site and
  contract catalog generate pages from enrolled repositories and their standard
  paths.

## Follow one schema through the system

```text
enrolled repos' docs/*.md
       |
       +--> cbd-docs-site collection
                     |
                     +--> rendered pages
                     +--> raw markdown routes (<url>.md)
                     +--> llms.txt
                     +--> contracts/docs-manifest.json

cbd-payments-service
  Zod request and event schemas
       |
       +-- pnpm run contracts --> contracts/openapi.json
       |                              |
       |                              +--> Orval --> dashboard client
       |
       +-- pnpm run contracts --> contracts/events/*.json
                                      |
                                      +--> NDJSON, Kafka, NATS, SQS, ...
                                                   |
                                                   +--> Python reporter validation
                                      |
                                      +--> EventCatalog pages
```

The consumers cross the artifact seam. They read artifacts at a tag rather than
the producer's `src/`.

Event identity, version, summary, producers, and consumers travel inside each
JSON Schema through an `x-eventcatalog` extension. The catalog validates that
metadata, rejects duplicate event IDs, and rebuilds its generated domain from
scratch so retired events disappear.

The event tests use the same NDJSON serializer as the running producer. Their
approved files expose encoding, object order, and record-delimiter changes in a
diff. Consumers treat JSON object order as non-semantic.

## Frontend to microservice type safety

The dashboard stands in for a browser frontend with a deployment independent of
the payments microservice. It does not import the producer's TypeScript types.
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

## One payload contract across message transports

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
            +--> NDJSON file written by `pnpm start` in cbd-payments-service
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
details in the catalog too. If the payment event keeps the same shape, a broker
change does not require a new payload schema.

## Run it yourself

Clone any one repository and run it alone:

```sh
git clone https://github.com/jagreehal/cbd-dashboard && cd cbd-dashboard
pnpm install
pnpm run generate   # fetches openapi.json from cbd-payments-service at the pinned tag
pnpm run check
```

Each README lists its commands. The Python reporter needs
`pip install -r requirements.txt` and no Node.

## Checks

| Failure | Where it stops |
|---|---|
| Runtime schema changed, artifact unchanged | cbd-payments-service CI: artifact drift check |
| Event retired, old schema file remains | cbd-payments-service CI: file-set check |
| Event encoding, object order, or delimiter changed | cbd-payments-service CI: NDJSON message snapshot |
| Dashboard still calls the old shape | cbd-dashboard CI, on the PR that bumps the pin |
| Generated client not committed after a regenerate | cbd-dashboard CI: `git diff --exit-code` |
| Frontend sends an invalid request at runtime | Microservice Zod validation |
| Producer emits an invalid event | Zod before append |
| Python receives an invalid event | cbd-reporter: JSON Schema validation |
| Two repositories claim the same event ID | cbd-catalog generation |
| Doc frontmatter missing a required field | Publishing repo's docs check, in Node or Python |
| Doc renamed or deleted while the latest manifest records an inbound link | Publishing repo's docs check against the published manifest |
| A doc links into another repo by relative path | Publishing repo's docs check |
| A dependency bump changes a generated artifact | Producer drift check. It caught zod 4.6 changing the date-time regex during the split, so producers now pin zod to one version |

## Related

This repo prevents drift at the producer. Three siblings cover what happens when
it gets past you, and where the resulting tests belong.

| Repo | The argument it owns |
| --- | --- |
| [api-schema-drift-measure-pin-prove](https://github.com/jagreehal/api-schema-drift-measure-pin-prove) | The other half of this story. When the contract froze years ago and five client generations diverged, you measure first: validate at the boundary in observe mode, read the mismatch off spans, then enforce by slice. Read this repo to stop the Friday rename; read that one for the renames that happened before the checks arrived. |
| [test-the-journey-not-the-dom](../test-the-journey-not-the-dom) | Testing orchestration across services below the browser. Its typed journeys reject a 200 OK carrying the wrong shape, the consumer-side backstop for the drift this repo prevents at the source. |
| [testing-levels](../../js/testing-levels) | Which test level owns which behaviour inside one service, and why a committed artifact beats the hand-written fixture that a mocked integration test would otherwise trust forever. |

## The monorepo case

A monorepo remains useful when one team releases coupled packages as
one product. It offers atomic changes, shared tooling, and one dependency
graph.

This pattern addresses a narrower problem: independent teams need an explicit
description of what crosses between them, and somewhere predictable to keep it.
Committed markdown with validated frontmatter makes the human half usable by
anyone, including whatever reads it on a customer's behalf at two in the
morning. OpenAPI and JSON Schema make the machine half usable from TypeScript,
Python, Go, Rust, or the JVM.

## Both mornings

The 2023 Confluence page still exists. A migration can redirect or archive it.
The payments runbook now has an owner, a Git date, and a stable address beside
the service. The company index places it next to incident policy from
`cbd-handbook`.

Producer CI rejects an `amount` rename when the committed artifact stays stale.
After regeneration, the dashboard typecheck names the call site that still
expects `amount`. The team can review the diff and stage a compatible overlap
before either service deploys.

Six repositories agree on two roots. A seventh publisher adds one GitHub
topic. It requires no per-document registration, consumer-specific integration,
or aggregator code change.
