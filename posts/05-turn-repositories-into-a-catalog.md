---
title: "Contract-first design, part 5: Turn repository conventions into a catalog"
series: contract-first-design
part: 5
---

# Turn repository conventions into a catalog

A perfect `payment.completed` schema still fails discovery when only three
people know which repository contains it.

The contract needs an address.

## Make location part of the convention

Every publishing repository in this example uses:

```text
contracts/openapi.json
contracts/events/*.json
docs/*.md
```

An organization-wide job needs only a list of repositories. It clones each one,
reads those paths, and builds a catalog. Individual producers do not import or
call the catalog.

The event artifacts carry an `x-eventcatalog` extension containing identity,
version, summary, producers, and consumers. The aggregator validates that
metadata, rejects duplicate event IDs, and writes EventCatalog pages with the
JSON Schema attached.

The TypeScript producer attaches that metadata with the published
`eventcatalog-generator-zod/define-event` helper. The catalog still reads the
committed JSON Schema, so producers in other languages only need to emit the
same artifact shape.

The same move works for authored documentation. A small indexer globs every
`docs/` directory and reads agreed frontmatter such as title, repository, and
owner.

## Keep the artifact language-neutral

The catalog reads JSON artifacts rather than scanning Zod source. A Go
producer, Python producer, and TypeScript producer appear identically when they
commit the same format.

This direction matters:

```text
producer repository -> committed artifact <- catalog
```

The producer owns its contract. The catalog observes it. A catalog outage
cannot prevent the producer from building or a consumer from validating a
message.

Predictable paths turn repository autonomy into discoverability. Teams keep
independent builds and releases while the organization gains one searchable
view.

Discovery solves “Where is the contract?” It does not solve the last hard
question: what happens when a producer intentionally changes it?

[← Part 4](04-one-payload-any-broker.md) ·
[Part 6: Make contract changes fail safely →](06-make-contract-changes-fail-safely.md)
