# Convention-based artifact publishing: the series

At 02:40 on a Sunday, an engineer replayed four hundred payments twice after an
assistant answered from a Confluence page written in 2023. At 09:17 on a
Monday, a dashboard turned each payment into £0.00.

Both teams owned a correct answer. Their consumers lacked an authoritative
address and a check for changes at that address.

Eight posts follow that idea from one broken frontend to a company where each
publisher uses the same two repository roots. Parts 1 to 6 cover machine
contracts. Parts 7 and 8 replace central authoring for operational
and technical documentation: teams write in git, and one index aggregates each
`docs/` directory. `cbd-handbook` shows the file shape available to a
non-engineering publisher.

Read from part 1 for the full argument. Start at part 7 if repository-owned
documentation brought you here.

## Part one: what machines exchange

1. [The £0.00 dashboard](01-the-zero-pound-dashboard.md)  
   Why copied types and green builds still allow contract drift.
2. [A typed frontend without backend source](02-a-typed-frontend-without-backend-source.md)  
   How OpenAPI becomes a generated client for a frontend with its own deployment.
3. [One event, two languages](03-one-event-two-languages.md)  
   How JSON Schema connects a TypeScript producer to a Python consumer.
4. [One payload across brokers](04-one-payload-any-broker.md)
   Where Kafka, NATS, SQS, RabbitMQ, and EventBridge fit.
5. [Turn repository conventions into a catalog](05-turn-repositories-into-a-catalog.md)  
   How well-known paths create organization-wide discovery.
6. [Make contract changes fail before release](06-make-contract-changes-fail-safely.md)
   How drift checks, wire snapshots, retirement, and versioning close the loop.

## Part two: repository-owned operational documentation

7. [The 02:40 runbook](07-the-two-forty-runbook.md)
   How repository ownership, frontmatter, and Git history identify the
   authoritative runbook.
8. [One index across repositories](08-one-index-for-every-repository.md)
   How one Astro collection turns enrolled repositories' `docs/` into a site
   for people and Markdown routes for machine readers.

The runnable proof is six repositories. [The README](../README.md#the-six-repositories)
links them and the pull requests that fail on purpose.
