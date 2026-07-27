---
title: "Contract-first design, part 1: The £0.00 dashboard"
series: contract-first-design
part: 1
---

# The £0.00 dashboard

At 09:17 on Monday, every payment in the dashboard read £0.00.

The payments microservice still held the right totals. On Friday its producer
had renamed `amount` to `value`. The dashboard deployed from another repository
and kept reading `amount`. Both builds passed because each repository remained
internally consistent.

The disagreement lived between them.

## Three fixes that move the problem

Copying the backend TypeScript type into the frontend gives the mismatch a new
place to hide. The copy can still go stale.

Publishing a shared package removes the copy, but now both repositories must
coordinate package releases. A Python consumer cannot use the TypeScript type
at runtime.

A monorepo can make the change atomic. It also changes repository ownership,
build tooling, permissions, and release coordination to solve one field
rename.

The actual requirement is smaller: every producer and consumer needs the same
description of the data that crosses between them.

## Put the agreement in a file

The payments microservice already uses Zod to validate live values. It can
generate two standard artifacts from those schemas:

```text
contracts/
  openapi.json
  events/
    payment.completed.json
    payment.failed.json
```

OpenAPI describes HTTP requests and responses. JSON Schema describes event
payloads. The producer commits both beside the code that generated them.

That committed artifact is reviewable, versioned, and usable from another
language. A consumer fetches it without importing the producer's source or
joining its build.

The £0.00 bug now has somewhere concrete to fail: CI compares the live schema
with the committed artifact and rejects the rename before release.

The next question belongs to the dashboard. A contract file can describe an
HTTP call, but how does it become a frontend experience developers can use?

[Part 2: A typed frontend without backend source →](02-a-typed-frontend-without-backend-source.md)
