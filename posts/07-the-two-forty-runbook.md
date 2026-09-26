---
title: "Convention-based artifact publishing, part 7: The 02:40 runbook"
series: convention-based-design
part: 7
---

# The 02:40 runbook

At 02:40 on Sunday, a payment had been stuck in `processing` for eleven
minutes. The on-call engineer had never replayed one. They asked the assistant,
got an answer in four seconds, and followed it.

Four hundred payments settled twice.

The procedure they needed was sitting in
[`docs/runbook.md`](https://github.com/jagreehal/cbd-payments-service/blob/main/docs/runbook.md)
in the payments repository,
updated eight weeks earlier by the team that owns it. The assistant had never
read that file. It had read a Confluence page from 2023, written for
infrastructure decommissioned the following spring, by someone who left the
company in between.

Both authors wrote correct instructions. Neither page told the engineer which
instructions still matched the service.

## Moving the page moves the problem

Move the runbook into Confluence and you separate it from the code that decides
whether it is still accurate. The next decommissioning writes the next stale
page.

Point the assistant at the payments repository and you have fixed one question.
The next incident crosses the dashboard and the reporter, and naming
repositories by hand stops working somewhere around the tenth.

Let a bot crawl links out of each README and you inherit whatever people
remembered to link. Unlinked pages stay invisible, stale links lead somewhere
wrong, and nothing in the crawl distinguishes the runbook from the meeting
notes.

The engineer needed one authoritative address. Each repository publishes its
documentation where a reader can guess it, with metadata that names the
document and its owner.

## Publish documentation beside contracts

Parts 1 to 6 used schemas to demonstrate the publishing rule. The payments
service commits `contracts/openapi.json` at a standard address, and part 5 turns
that address into a generated catalog.

Documentation is the same problem carrying a different payload.

```text
any-repo/
  contracts/          generated, committed
    openapi.json
    events/*.json
  docs/               authored, committed
    *.md
```

Each document opens by describing itself:

```yaml
---
title: Payments service runbook
owner: payments-platform
tags: [runbook, payments]
---
```

The schema requires `title` and `owner`, with optional `tags`. Zod generates it
as [`contracts/docs-frontmatter.json`](https://github.com/jagreehal/cbd-handbook/blob/v1.0.0/contracts/docs-frontmatter.json)
in `cbd-handbook`, so a Python repository reads
it with `jsonschema` and a TypeScript one with
`z.fromJSONSchema`. Neither imports the other's source, for the same reason no
consumer imports the payments source.

## Let git supply the last-change date

The failure at 02:40 came from a page last changed in 2023. A hand-written
`updated:` field can rot with the document. The aggregator reads the last
committed change from `git log`.

That date gives the reader evidence, not a freshness guarantee. Teams that need
stronger assurance can require owner reviews, tested runbooks, or expiry policy.
A `status: current` field cannot replace those checks.

## The check runs where the mistake was made

Each repository validates its own `docs/` in its own CI, beside its contract
check. A document with no owner fails the pull request that
introduced it.

TypeScript repositories call a reusable workflow that the handbook team
publishes beside the schema:

```yaml
docs:
  uses: jagreehal/cbd-handbook/.github/workflows/check-docs.yml@v1.0.0
  with:
    handbook-ref: v1.0.0
```

The Python repository runs its own
[`check_docs.py`](https://github.com/jagreehal/cbd-reporter/blob/main/check_docs.py)
against the same artifact, fetched at the same tag.

Two languages read one committed schema. Requiring the Node checker would force
the data platform team to adopt a toolchain it does not use. The handbook team
owns the checker along with the convention, so publishers build without the
docs site.

Git remains part of the publishing workflow. Teams that do not work in
repositories need an editor or export path that produces the same Markdown and
frontmatter. `cbd-handbook` proves the artifact shape, not the authoring
experience.

## Cross-repository links need stable IDs

```markdown
See [the payments runbook](../../cbd-payments-service/docs/runbook.md)   ✗
See [the runbook](runbook.md)                                        ✓
```

The first path resolves for someone holding both
repositories as sibling directories. On GitHub it is a dead link. In a fresh
clone it is a dead link. It assumes the monorepo part 1 turned down.

Use relative links inside your own repository. Across repositories, declare the
edge:

```yaml
related: [cbd-payments-service/runbook, cbd-reporter/daily-settlement-report]
```

A reference into somebody else's repository is a dependency, so it costs a line
and shows up where dependencies show up. A link to your own file stays free.

## The files still need an index

Four repositories now publish twelve documents at a path you can guess. That is
a filing system. Nothing has gathered it, nothing turns `related` into a link
you can click, and the assistant at 02:40 still has no idea any of it exists.

[← Part 6](06-make-contract-changes-fail-safely.md) ·
[Part 8: One index across repositories →](08-one-index-for-every-repository.md)
