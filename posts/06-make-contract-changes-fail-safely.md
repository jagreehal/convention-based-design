---
title: "Convention-based artifact publishing, part 6: Make contract changes fail before release"
series: convention-based-design
part: 6
---

# Make contract changes fail before release

Renaming `amount` to `value` was the right change. The field had meant three
things depending on which endpoint you asked, and somebody fixed it.

The team shipped the rename without a compatibility check or an overlap for the
old field. The dashboard met the new response on Monday morning.

## Check each representation

The producer describes the same agreement three ways:

```text
runtime Zod schemas
committed OpenAPI and JSON Schema artifacts
serialized event records
```

Each one can drift from the others, so CI checks all three. The producer
regenerates the artifacts and compares them with the committed files, and
compares the current event serialization against approved NDJSON records. The
dashboard regenerates its client from the pinned tag and typechecks. The
reporter validates events against the pinned schemas.

Each check runs in the repository that owns it. I left the failing pull
requests open:

| Pull request | CI |
|---|---|
| [cbd-payments-service#1](https://github.com/jagreehal/cbd-payments-service/pull/1): rename `amount` to `value`, tagged `v2.0.0-beta.1` | green |
| [cbd-dashboard#1](https://github.com/jagreehal/cbd-dashboard/pull/1): bump to `v2.0.0-beta.1` | red, `tsc` |
| [cbd-reporter#1](https://github.com/jagreehal/cbd-reporter/pull/1): bump to `v2.0.0-beta.1` | red, `jsonschema` |

The producer's build passes because the rename is consistent inside its own
repository. The consumers pin a tag, so their CI runs the new contract against
their code and fails.

The drift check also caught a change I did not intend. When I split the
repositories, a fresh install resolved zod 4.6 in place of the 4.4 the monorepo
had locked, and 4.6 generates a different date-time pattern. The producer check
failed before I published anything. Producers now pin zod to one version,
because its output is the contract.

## Retire on purpose

Compare the artifact directory with the complete generated file set. Delete an
event from source while its old schema remains in `contracts/events/`, and
consumers keep seeing a supported event that the producer has retired.

This repository regenerates event directories and catalog domains in full, so a
retired event disappears from the artifacts and from the catalog together.

A breaking change needs a new version and an overlap. Producers and consumers
run both while traffic drains from a Kafka topic, NATS stream, SQS queue, or
stored log. Compatibility tests check that a new reader accepts records from
the old producer. Deployment policy keeps the old producer shape available
until consumers move.

## Finish with a clean tree

The dashboard's CI regenerates its client from the pinned contract and runs
`git diff --exit-code` before typechecking. If you leave a regenerated client
out of the commit, the build fails. It also fails if you bump the pin without
regenerating.

Each repository can keep its release schedule when consumers pin artifacts and
producers support compatible overlap. Each change remains visible on the way
through:

```text
runtime schema
  -> reviewed artifact
  -> generated or validating consumer
  -> live traffic
```

Next Friday, an uncommitted `amount` rename fails producer CI. A regenerated
contract then fails the current dashboard. Those checks expose the work; the
team still owns versioning and rollout order for HTTP and event consumers.

On Monday morning, the dashboard reads £42.

The machine half now has a complete proof across repositories. The producer publishes what it
sends in a form other languages can read, and CI checks each representation.

The engineer at 02:40 still needs replay instructions, and the assistant has no
route to the repositories that contain them.

[← Part 5](05-turn-repositories-into-a-catalog.md) ·
[Part 7: The 02:40 runbook →](07-the-two-forty-runbook.md)
