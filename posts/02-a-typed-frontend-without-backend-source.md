---
title: "Contract-first design, part 2: A typed frontend without backend source"
series: contract-first-design
part: 2
---

# A typed frontend without backend source

The first post left the dashboard holding an OpenAPI file. Nobody wants to
hand-write `fetch()` calls by reading 200 lines of JSON.

The artifact becomes useful when a generator turns it into the frontend's
native interface.

## Generate the client

In this repository, Orval reads
`payments-service/contracts/openapi.json` and writes a TypeScript client into
the dashboard:

```text
OpenAPI
  -> request and response types
  -> route and method definitions
  -> typed fetch client
  -> frontend typecheck
```

The generated `createPayment()` function accepts the request body described by
the microservice contract. Its result is a union of the documented success and
error responses. The frontend compiler knows which fields exist after it
checks the HTTP status.

The dashboard imports generated code. It never imports
`payments-service/src/`.

## Compile-time and runtime have different jobs

The generated client protects code written against it. It cannot stop an old
browser bundle, a third-party caller, or a manually constructed request from
sending bad data.

The microservice therefore validates the live request with the same Zod schema
that produced the OpenAPI artifact. The frontend compiler catches developer
mistakes before deployment; the producer rejects invalid traffic after
deployment.

The demo proves both sides:

```sh
(cd dashboard && npm run generate && npm run check)
./demo.sh
```

It generates the client, starts the microservice, creates a payment, and fetches
that payment through the generated functions.

The original `amount` to `value` rename can no longer remain invisible. The
producer's artifact check fails first. After an intentional contract update,
the regenerated frontend client makes incompatible call sites fail their
typecheck.

HTTP now has a safe path from microservice schema to frontend code. The next
consumer is harder: it is written in Python, and it receives events rather than
HTTP responses.

[← Part 1](01-the-zero-pound-dashboard.md) ·
[Part 3: One event, two languages →](03-one-event-two-languages.md)
