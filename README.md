# Contract-first design

Two services once disagreed about one field. The producer renamed `amount` to
`value`, the consumer kept reading `amount`, and every payment in the dashboard
showed £0.00 until someone noticed in production. The fix wasn't sharing more
code — it was making the contract a first-class artifact.

## The idea

Cross-service type safety doesn't require sharing **code**. It requires
sharing **contracts** — and contracts have industry-standard formats: OpenAPI
for request/response, JSON Schema for events, frontmatter conventions for
docs. Generate them from the schemas that already validate at runtime, commit
them at a well-known path, and:

- any language can consume them (TypeScript, Python, Go, Rust, JVM…),
- repos version and deploy independently,
- and company-wide tooling can aggregate every repo into one place —
  automatically, because everyone follows the same convention.

**The convention:** every repo commits well-known folders at its root.

```
any-repo/
  contracts/            # generated from runtime schemas, drift-checked in CI
    openapi.json        #   its API
    events/*.json       #   its events
  docs/                 # authored docs with agreed frontmatter
    *.md                #   title, repo, owner, tags
```

That's the whole trick — the same one the web uses with `/.well-known/`. Once
the location and format are agreed, aggregators don't need cooperation from
individual repos, just a list of them.

## The cast

Each top-level directory stands in for a separate company repo:

| Directory | Stands in for | Role |
|---|---|---|
| `payments-service/` | a TypeScript service repo | **Producer.** Zod schemas are the source of truth; `contracts/` is generated from them, `docs/` carries agreed frontmatter. |
| `dashboard/` | a TypeScript frontend repo | **API consumer.** [orval](https://orval.dev) generates a fully typed client from `openapi.json`. Zero shared code. |
| `reporter/` | a Python repo | **Event consumer.** ~50 lines validating events against the committed JSON Schemas — contract-first is language-neutral by construction. |
| `catalog/` | a company-wide docs repo | **Aggregator.** [EventCatalog](https://www.eventcatalog.dev) with a ~70-line artifact-first generator that reads every conforming repo's committed `contracts/events/*.json` — never their source — and publishes one browsable catalog of events, services and domains. |

Plus `docs-index.mjs` at the root: twenty lines that glob `*/docs/*.md` and
build a company-wide docs index from the agreed frontmatter — the docs half
of the convention, aggregated as easily as the schema half.

## How the contract flows

```
payments-service (Zod, runtime validation)
      │  npm run contracts        ──►  contracts/openapi.json
      │                           ──►  contracts/events/*.json
      │  npm run check            (CI: fails if code drifts from artifacts)
      │
      ├──► dashboard      orval → typed fetch client → tsc --noEmit
      ├──► reporter       python + jsonschema validates the event stream
      ├──► catalog        reads contracts/events/*.json, documents events/services/domains
      └──► docs-index     globs docs/ frontmatter across every repo
```

Every consumer — dashboard, reporter, catalog — touches only the committed
artifacts, never the service's source. Event metadata (producers, consumers,
version, summary) travels *inside* the artifact as an `x-eventcatalog`
extension, so a Go or Python repo that commits conformant JSON shows up in
the catalog identically. `defineEvent()` is 20 vendored lines using a
`Symbol.for` registry key, so even the metadata annotation needs no
dependency.

## Run it

```sh
(cd payments-service && npm install)
(cd dashboard && npm install)
(cd catalog && npm install)
./demo.sh
```

`demo.sh` checks the committed contracts against the code (CI semantics),
then *proves* the check works — it renames `amount` in the producer schema,
watches the check fail, and reverts — then regenerates + typechecks the orval
client, runs a live round-trip (typed client → server → event log → Python
validation), builds the docs index, and rebuilds the catalog. Browse the
catalog with `cd catalog && npm run dev`. After an intentional schema change,
`npm run contracts` regenerates the artifacts for committing.

Requires Node ≥ 22.6 (native TypeScript, no build step) and Python 3 with
`jsonschema`.

## Where this scales

The pattern isn't limited to schemas. Anything with an agreed location and
format aggregates the same way:

- **Living documentation** — [executable-stories-astro](https://github.com/jagreehal/executable-stories)
  turns test-run output into a hot-reloading Astro docs site and ingests
  authored `docs/` folders alongside it; point its `sources` list at each
  repo's report and scenario docs aggregate company-wide too.
- **Astro content loaders** — a glob loader over cloned repos'
  `docs/**/*.md` with the agreed frontmatter gives one documentation site
  for the whole company, no per-repo build step.
- **Anything else** — ADRs, SLOs, ownership metadata: same move. Well-known
  path in, aggregator out.

## Isn't this what monorepos are for?

Often the reason teams reach for one. Worth comparing what you actually get:

| You wanted | Monorepo gives you | Contract-first gives you |
|---|---|---|
| Type-safe calls between services | Shared TS types — TS-only | Generated clients in any language |
| One source of truth | One repo, lockstep versioning | One artifact per repo, versioned with the code |
| Discoverability | Grep, tribal knowledge | Aggregated catalog + docs index built from every repo |
| Drift protection | The compiler (until Python shows up) | A CI check per repo + schema validation at runtime |

A monorepo is still the right call when one team ships one product from
tightly coupled packages — this isn't an argument against them. It's an
argument that *contracts* were never the reason to need one.

That renamed field from the first paragraph? Here it fails in
`payments-service` CI as "openapi.json is stale", and if it ships anyway the
reporter prints `INVALID payment.completed` instead of £0.00. Caught twice
before a human ever squints at a dashboard.

## Notes

- The catalog's `repos` list is where company-wide aggregation happens: CI
  clones each conforming repo and appends it to the list. One entry per repo.
- TypeScript repos that don't want to commit artifacts have a code-first
  alternative: [eventcatalog-generator-zod](https://github.com/jagreehal/eventcatalog-generator-zod)
  scans Zod schemas directly (its `defineEvent` convention is where this
  repo's metadata annotation comes from). The artifact-first generator here
  is the language-neutral proof.
