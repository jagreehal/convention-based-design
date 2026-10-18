---
title: "Convention-based artifact publishing, part 5: Turn repository conventions into a catalog"
series: convention-based-design
part: 5
---

# Turn repository conventions into a catalog

A new engineer asks which service emits `payment.completed`. Three people know.
Two of them are on holiday and the third answers in Slack, where the answer
sinks out of scroll within a day and gets asked again next month.

A schema without a discoverable address goes unused.

## Make the location part of the agreement

Each publishing repository in this example uses the same two roots:

```text
contracts/openapi.json
contracts/events/*.json
docs/*.md
```

A company-wide job finds the enrolled repositories, clones each one, reads those
paths, and builds a catalog. In
[`cbd-catalog`](https://github.com/jagreehal/cbd-catalog), enrolment is a GitHub
topic: every repository tagged `cbd-publisher` appears in
[the catalog](https://jagreehal.github.io/cbd-catalog/) on its next build.
Producers neither import nor call the catalog. To add an eleventh repository,
you add one topic. You register no events, and the catalog code does not name
the repository.

Event artifacts carry an `x-eventcatalog` extension holding identity, version,
summary, producers, and consumers. The aggregator reads that metadata and
writes catalog pages with the JSON Schema attached. Two repositories that claim
the same event ID each keep their own page, under the repository's name.

The TypeScript producer attaches that metadata with the published
`eventcatalog-generator-zod/define-event` helper. The catalog reads the
committed JSON either way, so a Go or Python producer joins by emitting the
same artifact shape.

## The dependency arrow points one way

```text
producer repository -> committed artifact <- catalog
```

The producer owns its contract. The catalog reads the published artifact.
Committed inputs keep producer builds off the catalog's critical path. Teams can
serve those inputs from a registry, release asset, or artifact store as long as
consumers can pin and cache them.

Take the catalog offline and the producer still builds. The dashboard can
generate its client from its pinned artifact, and the reporter can validate
records. Readers lose discovery until the catalog returns.

Reading committed JSON rather than scanning Zod source is what makes that
possible. A Go producer, a Python producer, and a TypeScript producer look
identical to the aggregator, because it reads their artifacts instead of their
source.

Predictable paths turn repository autonomy into something searchable. Every team
keeps its own build and its own release schedule, and the company gets one view
across all of them.

The catalog answers where the contract is. Part 6 covers an intentional field
rename and the release work that follows.

[← Part 4](04-one-payload-any-broker.md) ·
[Part 6: Make contract changes fail before release →](06-make-contract-changes-fail-safely.md)
