# You might not need a monorepo

Two services once disagreed about one field. The producer renamed `amount` to
`value`, the consumer kept reading `amount`, and every payment in the dashboard
showed £0.00 until someone noticed in production. The post-mortem's fix was
"move everything into a monorepo so the types are shared."

This repo is the other fix.

## The idea

Teams reach for a monorepo to get *type-safe contracts between services*. But
the contract doesn't have to be shared **code** in a shared **workspace** — it
can be a committed **artifact** in an industry-standard format. OpenAPI for
request/response, JSON Schema for events. Then:

- any language can consume it (TypeScript, Python, Go, Rust, JVM…),
- repos version and deploy independently,
- and a company-wide convention makes every repo's contracts discoverable and
  aggregatable.

**The convention:** every repo commits a `contracts/` folder at its root —
`openapi.json` for its API, `events/*.json` for its events — generated from
the same schemas that validate at runtime, with a CI check that fails when
code drifts from the committed artifacts.

## The cast

Each top-level directory stands in for a separate company repo:

| Directory | Stands in for | Role |
|---|---|---|
| `payments-service/` | a TypeScript service repo | **Producer.** Zod schemas are the source of truth; `contracts/` is generated from them. |
| `dashboard/` | a TypeScript frontend repo | **API consumer.** [orval](https://orval.dev) generates a fully typed client from `openapi.json`. Zero shared code. |
| `reporter/` | a Python repo | **Event consumer.** ~50 lines validating events against the committed JSON Schemas. The thing a TS monorepo structurally cannot give you. |
| `catalog/` | a company-wide docs repo | **Aggregator.** [EventCatalog](https://www.eventcatalog.dev) + [eventcatalog-generator-zod](https://github.com/jagreehal/eventcatalog-generator-zod) scan every conforming repo and publish one browsable catalog of events, services and domains. |

## How the contract flows

```
payments-service (Zod, runtime validation)
      │  npm run contracts        ──►  contracts/openapi.json
      │                           ──►  contracts/events/*.json
      │  npm run check            (CI: fails if code drifts from artifacts)
      │
      ├──► dashboard   orval → typed fetch client → tsc --noEmit
      ├──► reporter    python + jsonschema validates the event stream
      └──► catalog     scans the repo, documents events/services/domains
```

The service never imports the catalog; the catalog scans the service. The
dashboard never imports the service; it consumes its spec. `defineEvent()` is
15 vendored lines using a `Symbol.for` registry key, so even the metadata
handshake needs no dependency.

## Run it

```sh
(cd payments-service && npm install)
(cd dashboard && npm install)
(cd catalog && npm install)
./demo.sh
```

`demo.sh` regenerates contracts, fails on drift, regenerates + typechecks the
orval client, runs a live round-trip (typed client → server → event log →
Python validation), and rebuilds the catalog. Browse the catalog with
`cd catalog && npm run dev`.

Requires Node ≥ 22.6 (native TypeScript, no build step) and Python 3 with
`jsonschema`.

## What the monorepo was actually for

| You wanted | You got with a monorepo | You get with contracts |
|---|---|---|
| Type-safe calls between services | Shared TS types — TS-only | Generated clients in any language |
| "One source of truth" | One repo, lockstep versioning | One artifact per repo, versioned with the code |
| Discoverability | Grep, tribal knowledge | An aggregated catalog built from every repo |
| Drift protection | The compiler (until Python shows up) | A CI check per repo + schema validation at runtime |

A monorepo is still the right call when one team ships one product from
tightly coupled packages. But if the reason is *contracts*, the contract
layer can be a spec — and specs don't care what language you speak.

That renamed field from the first paragraph? Here it fails in
`payments-service` CI as "openapi.json is stale", and if it ships anyway the
reporter prints `INVALID payment.completed` instead of £0.00. Caught twice
before a human ever squints at a dashboard.

## Notes

- `eventcatalog-generator-zod` is linked via `file:` until it's published to npm.
- The catalog's `source` list is where company-wide aggregation happens: CI
  clones each conforming repo and appends it to the list. One entry per repo.
