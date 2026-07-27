/**
 * Company-wide contract catalog. Every repo that follows the convention
 * (Zod events in code, contracts/ artifacts at the root) gets aggregated
 * here — add a repo to `source` and it appears in the catalog.
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
      'eventcatalog-generator-zod',
      {
        // one entry per company repo; in real life these are cloned/fetched by CI
        source: ['../payments-service'],
        domain: { id: 'payments', name: 'Payments', version: '1.0.0' },
      },
    ],
  ],
};
