---
title: "Convention-based artifact publishing, part 2: A typed frontend without backend source"
series: convention-based-design
part: 2
---

# A typed frontend without backend source

Open [`contracts/openapi.json`](https://github.com/jagreehal/cbd-payments-service/blob/v1.0.0/contracts/openapi.json)
in `cbd-payments-service` and you get 200 lines of nested
JSON describing two endpoints. A hand-written `fetch()` layer would repeat each
field and route where they can drift.

A generator turns the file into something the frontend can hold.

## Generate the client

Orval fetches the committed artifact at a pinned tag and writes TypeScript into
the dashboard. The pin is one line in
[`orval.config.ts`](https://github.com/jagreehal/cbd-dashboard/blob/main/orval.config.ts):

```ts
const PAYMENTS_CONTRACT = 'v1.0.0';
```

The chain from there:

```text
OpenAPI
  -> request and response types
  -> route and method definitions
  -> typed fetch client
  -> frontend typecheck
```

The generated `createPayment()` takes the request body the microservice
declares. Its result is a union of the documented success and error responses,
so the compiler narrows the fields after you check the HTTP
status.

The dashboard imports generated code without importing anything from
`cbd-payments-service`.

## The compiler and the server have different jobs

The generated client protects code written against it. It cannot do anything
about an old browser bundle still open in someone's tab, a third-party caller,
or a request somebody assembled by hand.

The microservice validates each live request with the same Zod schema that
produced the artifact. The compiler catches your mistakes before deployment.
The producer rejects invalid traffic after deployment.

Deleting server-side validation would remove the check for old browser bundles,
third-party callers, and requests assembled outside the generated client.

## Watch the rename fail in the right repository

[cbd-payments-service#1](https://github.com/jagreehal/cbd-payments-service/pull/1)
renames `amount` to `value`, regenerates the contracts, and updates its tests.
Its CI passes. The source, tests and contracts in that repository agree, and
none of its checks read the dashboard.

The commit is tagged `v2.0.0-beta.1`.
[cbd-dashboard#1](https://github.com/jagreehal/cbd-dashboard/pull/1) changes
`PAYMENTS_CONTRACT` to that tag and regenerates the client. Its CI is red:

```text
src/main.ts(3,39): error TS2353: Object literal may only specify known
  properties, and 'amount' does not exist in type 'CreatePaymentBody'.
```

The dashboard team meets the £0.00 bug from part 1 in their own pull request,
before production. The dashboard's `main` stays on `v1.0.0`
until its code moves.

A red dashboard build exposes consumer impact. It does not make the rollout safe; the producer must support
the old and new shapes until deployed consumers move.

HTTP has a safe path from schema to frontend code. The next consumer is
harder. It runs in Python, it receives events rather than responses, and it
cannot import a single line of any of this.

[← Part 1](01-the-zero-pound-dashboard.md) ·
[Part 3: One event, two languages →](03-one-event-two-languages.md)
