// Fails when code drifts from the committed contracts/ artifacts, or when
// the schemas stop enforcing the boundary. Run in CI before publish.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPaymentRequestSchema } from './api.ts';
import { paymentCompletedEventSchema } from './events.ts';
import { buildContracts } from './contracts.ts';

const contractsDir = fileURLToPath(new URL('../contracts', import.meta.url));
const read = (p: string) => JSON.parse(readFileSync(`${contractsDir}/${p}`, 'utf8'));

const { openapi, events } = buildContracts();

assert.deepEqual(read('openapi.json'), openapi, 'openapi.json is stale — run `npm run contracts` and commit');
for (const [type, schema] of Object.entries(events)) {
  assert.deepEqual(read(`events/${type}.json`), schema, `events/${type}.json is stale — run \`npm run contracts\` and commit`);
}

assert.equal(createPaymentRequestSchema.safeParse({ amount: -5, currency: 'GBP' }).success, false);
assert.equal(createPaymentRequestSchema.safeParse({ amount: 42, currency: 'GBP' }).success, true);
assert.equal(
  paymentCompletedEventSchema.safeParse({ type: 'payment.completed', payment: {}, settledAt: 'nope' }).success,
  false
);

console.log('contracts in sync, boundary schemas enforcing');
