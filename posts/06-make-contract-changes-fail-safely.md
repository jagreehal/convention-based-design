---
title: "Contract-first design, part 6: Make contract changes fail safely"
series: contract-first-design
part: 6
---

# Make contract changes fail safely

The series began with one unreviewed rename. A contract system earns its place
when that rename cannot slip through.

## Check every representation

The producer has three representations of the agreement:

1. Runtime Zod schemas
2. Committed OpenAPI and JSON Schema artifacts
3. Serialized event records

CI compares the generated artifacts with the committed files. It also compares
the current event serialization with approved NDJSON records. The dashboard
regenerates its client and runs a typecheck. The Python reporter validates a
real emitted record.

The demo temporarily changes `amount` to `value` and requires the artifact
check to fail. It then restores the source and runs the complete path.

## Retire and version deliberately

Drift checks must compare the complete artifact directory, not only files the
current code knows about. Otherwise deleting an event from source leaves a
stale schema that still appears supported.

This repository replaces generated event directories and catalog domains in
full. Retired events disappear instead of surviving as documentation ghosts.

An intentional breaking change needs a new contract version and a migration
plan. Producers and consumers can overlap versions while traffic drains from a
Kafka topic, NATS stream, SQS queue, or stored event log. Compatibility tests
can prove that a new reader still accepts records written by the old producer.

## Finish with a clean tree

CI runs the full demonstration and then checks for modified, deleted, and
untracked files. A newly generated client, schema, snapshot, or catalog page
cannot pass without being committed.

The result is not lockstep deployment. Each repository can release
independently because the change is explicit:

```text
runtime schema
  -> reviewed artifact
  -> generated or validating consumer
  -> live traffic
```

On the next Friday, renaming `amount` to `value` turns CI red. The failure does
not care whether the consumer is a browser using HTTP, Python reading Kafka,
or a worker polling SQS.

On Monday morning, the dashboard still reads £42.

[← Part 5](05-turn-repositories-into-a-catalog.md) ·
[Back to the runnable repository](../README.md)
