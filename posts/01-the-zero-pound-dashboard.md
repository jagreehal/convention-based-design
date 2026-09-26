---
title: "Convention-based artifact publishing, part 1: The £0.00 dashboard"
series: convention-based-design
part: 1
---

# The £0.00 dashboard

At 09:17 on Monday, each payment in the dashboard read £0.00.

Support noticed first, because customers had begun calling about money the bank
had charged. The payments microservice held the right totals the whole
time. On Friday someone renamed `amount` to `value`, shipped it, and went home.
The dashboard deploys from a different repository and carried on reading
`amount`.

Both builds were green. Each repository was correct on its own. Put them
together and one was reading a field the other had stopped sending.

## Popular fixes move the boundary

Copy the backend TypeScript type into the frontend and you now maintain two
definitions of one shape. A shared package removes that copy, and consumers can
pin a version while they release on their own schedule. The package still ties
consumers to its language and lifecycle, and the Python reporter cannot use a
TypeScript type at runtime.

Merge the source into a monorepo and one commit can update both call sites. The
producer and dashboard still deploy at different times, so a breaking API change
needs an overlap. The move also changes ownership, permissions, and build
tooling across the organisation.

Both teams need the same description of the data crossing between them, in a
form they can read without running either service.

## Put the agreement in a file

The payments microservice validates live values with Zod. Those same
schemas generate two standard artifacts:

```text
contracts/
  openapi.json
  events/
    payment.completed.json
    payment.failed.json
```

OpenAPI describes HTTP requests and responses. JSON Schema describes event
payloads. The producer commits both beside the code that generated them.

You can review a committed artifact, version it, and read it from any language.
The dashboard fetches one file, at a tag, without importing the payments source.

An uncommitted `amount` rename now has somewhere concrete to fail. Producer CI
regenerates the artifacts, compares them with the committed files, and rejects
the mismatch. After an intentional rename, the dashboard regenerates its client
and fails on each call site that still reads `amount`. A safe release then needs
version overlap between producer and consumer.

OpenAPI gives the agreement a neutral format. The repository convention gives
each consumer a predictable place to find it. Part 7 applies the same ownership
rule to documentation.

The dashboard still holds a JSON file. Hand-writing `fetch()` calls against 200
lines of it would recreate the mismatch in client code.

[Part 2: A typed frontend without backend source →](02-a-typed-frontend-without-backend-source.md)
