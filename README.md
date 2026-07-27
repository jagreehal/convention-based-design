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

## Four separate repositories, shown together

Each top-level directory stands in for a separate company repository:

| Directory | Role |
|---|---|
| `payments-service/` | TypeScript producer. Zod is the runtime source of truth; `contracts/` is generated and committed. |
| `dashboard/` | TypeScript request/response consumer. Orval generates its fetch client from `openapi.json`. |
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
                                      +--> Python reporter validation
                                      |
                                      +--> EventCatalog pages

docs/*.md ----------------------------+--> company docs index
```

Every consumer crosses the artifact seam. None reads
`payments-service/src/`.

Event identity, version, ownership, producers, and consumers travel inside each
JSON Schema through an `x-eventcatalog` extension. The catalog validates that
metadata, rejects duplicate event IDs, and rebuilds its generated domain from
scratch so retired events disappear.

The event tests use the same NDJSON serializer as the running producer. Their
approved files pin the compact bytes, field order, and record delimiter that
the reporter receives.

## Run the proof

Requires macOS, Node 24, and Python 3 with `jsonschema`.

```sh
(cd payments-service && npm install)
(cd dashboard && npm install)
(cd catalog && npm install)
./demo.sh
```

The script performs the proof in this order:

1. Typecheck the producer and compare its current schemas with the committed
   artifacts.
2. Rename `amount` to `value` temporarily and require the drift check to fail.
3. Restore the source, regenerate the dashboard client, and typecheck it.
4. Start the producer and send a request through the generated client.
5. Validate the emitted NDJSON record in Python.
6. Generate the documentation index and EventCatalog.

The cleanup trap restores the producer source and stops the server even when
the demonstration exits early. CI runs the same script on macOS with Node 24,
then rejects modified, deleted, or untracked generated files.

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
morning, so the dashboard never gets the chance to print £0.00.
