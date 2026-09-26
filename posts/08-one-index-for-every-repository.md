---
title: "Convention-based artifact publishing, part 8: One index across repositories"
series: convention-based-design
part: 8
---

# One index across repositories

Turning twelve Markdown files scattered across four repositories into a
[browsable site](https://jagreehal.github.io/cbd-docs-site/) takes thirty lines
of configuration and one shell loop. Most of it specifies where to look.

## One collection spans the enrolled repositories

A repository enrols by carrying the `cbd-publisher` GitHub topic. Before each
build, [`cbd-docs-site`](https://github.com/jagreehal/cbd-docs-site) lists
those repositories and clones them into `repos/`:

```sh
for r in $(gh repo list jagreehal --topic cbd-publisher --json name --jq '.[].name'); do
  git clone -q --filter=blob:none https://github.com/jagreehal/$r repos/$r
done
```

Astro content collections default to `src/content/`. The `glob` loader accepts
any `base`:

```ts
loader: glob({
  base: './repos',
  pattern: '*/docs/**/*.md',
  generateId: ({ entry }) => entry.replace('/docs/', '/').replace(/\.md$/, ''),
})
```

Add the topic to a repository and its documents appear on the next build without
per-document registration. Remove the topic and they disappear.

`generateId` turns `cbd-payments-service/docs/runbook.md` into
`cbd-payments-service/runbook`. Where a document lives is its address, which is why
no document declares an id and why two teams cannot collide on one.

## The schema comes from the artifact

The collection validates frontmatter against `contracts/docs-frontmatter.json`
from the cloned `cbd-handbook`, the same file the Python check reads:

```ts
const frontmatter = zod.fromJSONSchema(artifact);

schema: z.custom((value) => frontmatter.safeParse(value).success)
```

Writing the four fields in the site would create a second copy of the handbook
schema. The aggregator reads the artifact that publishing repositories use.

## The question a repository cannot answer alone

Each run publishes
[`contracts/docs-manifest.json`](https://jagreehal.github.io/cbd-docs-site/contracts/docs-manifest.json)
to GitHub Pages:

```json
{
  "cbd-payments-service/contract-reach": {
    "owner": "payments-platform",
    "title": "One contract from browser to broker",
    "updated": "2026-09-26T13:26:18+01:00",
    "linkedFrom": ["cbd-dashboard/reading-the-contract", "cbd-reporter/validating-events-in-python"]
  }
}
```

The aggregator consumes documentation and produces a manifest under the same
`contracts/` root as the other generated artifacts. It acts as a producer.

The build reads the `updated` date from `git log` inside each clone. A
blobless clone (`--filter=blob:none`) keeps the full history and skips old file
contents, which is enough to find each document's last change.

`linkedFrom` brings information into a repository that its own checkout cannot
supply. Rename a file, and the manifest lets the pull request check name inbound
links from other repositories:

```text
✗ cbd-payments-service/contract-reach no longer exists but is linked from
  cbd-dashboard/reading-the-contract, cbd-reporter/validating-events-in-python
```

[cbd-payments-service#2](https://github.com/jagreehal/cbd-payments-service/pull/2)
produced that output. The pull request deletes the file, and I left it open. No
file in the payments repository references the document. The manifest records
the two inbound links, and the check uses it to fail the pull request that
would break them.

The manifest lags one run behind, so publishing a document and linking to it
from another repository takes two steps. Publish, wait, then link. That is the
expand-then-contract discipline from the schema half.

A stale manifest rejects a new link that would have worked and does not accept
a broken target, so adds fail closed. Rename protection has a window. The check
can name the inbound links from the last aggregation. A link merged after
that run remains invisible until the next manifest. The job's schedule sets the length of that window.

## The job

The docs site rebuilds hourly, on its own pushes, and on demand:

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '17 * * * *'
  workflow_dispatch:
```

That gives a rename window of up to an hour. To shorten it, have each
publisher send a `repository_dispatch` event after its check passes on the
default branch, and keep the schedule as the repair path. Each publisher then
needs a stored token with access to the docs site, so this example stops at the
schedule. Publishers do not wait on the aggregator in either setup.

## The operating model

Two components know that more than one repository exists: this job and the
catalog from part 5. Both list repositories by the same topic. The payments
service does not know that the dashboard reads its runbook. The reporter does
not integrate with the index.

They read the same committed files for different purposes. Neither owns the
source documents. Replacing either aggregator leaves each document in its
publishing repository.

Teams share two directory names and a schema. A new publisher adds the topic,
writes files under `docs/`, and calls the checker. The
aggregator needs no code change for its documents. Removing the repository from
discovery reverses the process.

The schema, discovery job, access policy, and generated site still need an
owner. The convention removes central page authoring and per-document catalog
work. It does not remove platform operations.

## Formats for assistants

Astro emits HTML around the Markdown from git. Each page also has a raw route:

```text
/cbd-docs-site/cbd-payments-service/runbook        rendered, for people
/cbd-docs-site/cbd-payments-service/runbook.md     raw markdown, for machine readers
```

Both come from the same collection. The `.md` route is fifteen lines.

An `llms.txt` at the root lists documents from the enrolled repositories with
their owners. The build generates it from the same collection as the site.

In July 2026, [Evil Martians measured about 268,000 agent requests over two
months](https://evilmartians.com/chronicles/which-ai-actually-reads-your-site-two-months-of-llm-traffic-measured).
Named AI assistants made 37 direct `llms.txt` fetches. The file costs little to
generate, but those logs do not support treating it as a discovery mechanism.

The same dataset recorded Claude Code asking for Markdown on 76% of 23,300
requests through `Accept: text/markdown`. The static site cannot negotiate
content, so the extension provides the same representation at a stable URL.
The measurement supports serving Markdown to agents that request it; it does
not prove that agents will discover the `.md` routes on their own.

## Both mornings

At 09:17 on a Monday the dashboard read £0.00, because the payments service
renamed a field and nothing sat between that rename and the customer.

At 02:40 on a Sunday an engineer replayed from the wrong offset, because the
true runbook sat outside their tools' search path.

Both failures crossed the same gap. A team owned the answer, but its consumers
lacked an authoritative address and a check for changes at that address.

Six repositories now agree on two roots. `contracts/` for what machines
exchange, `docs/` for what people need to know, both committed beside the code
they describe, both checked by the repository that owns them. The catalog reads
one. The documentation site reads the other. Both find publishers by topic;
publishers remain independent of both.

The 2023 Confluence page still exists. A migration can redirect or archive it.
The repository copy has an owner, a last-change date, and a stable place in the
index. At 02:40, the engineer now has evidence for choosing the runbook that the
payments team maintains.

[The README](../README.md) links the repositories and the four failing pull
requests.

[← Part 7](07-the-two-forty-runbook.md) ·
[Back to the README](../README.md)
