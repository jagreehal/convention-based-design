/**
 * Company-wide contract catalog. Every repo that follows the convention
 * (language-neutral contracts/ artifacts at the root) gets aggregated
 * here. Add a repo to `repos` and it appears in the catalog.
 */
export default {
  cId: 'ymnn-a-monorepo-demo',
  title: 'Acme Contract Catalog',
  tagline: 'Every contract from every repo, one place',
  organizationName: 'Acme',
  homepageLink: 'https://example.com',
  port: 3000,
  outDir: 'dist',
  base: '/',
  trailingSlash: false,
  generators: [
    [
      './generators/contracts.mjs',
      {
        // one entry per company repo; in real life these are cloned/fetched by CI
        repos: ['../payments-service'],
        domain: {
          id: 'payments',
          name: 'Payments',
          version: '1.0.0',
          summary: 'HTTP and event contracts shared across repositories, languages, and transports.',
          markdown: [
            'The dashboard generates a typed frontend client from the payments OpenAPI artifact.',
            'Event consumers validate the committed JSON Schema payloads after their transport adapter removes any Kafka, NATS, SQS, RabbitMQ, EventBridge, or NDJSON envelope.',
            'Payload schemas stay stable when delivery infrastructure changes. Topics, subjects, queues, routing, retries, and acknowledgements belong to the transport contract.',
          ].join('\n\n'),
        },
      },
    ],
  ],
};
