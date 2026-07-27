// Pins the serialized bytes of each event — the JSON Schema check guards the
// shape, this guards the exact wire format consumers parse.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  eventNdjsonSerializer,
  paymentCompletedEventSchema,
  paymentFailedEventSchema,
} from './events.ts';

const payment = {
  id: 'pay_fixed',
  amount: 42,
  currency: 'GBP' as const,
  status: 'completed' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function approved(name: string): string {
  return readFileSync(new URL(`__contracts__/${name}.approved.txt`, import.meta.url), 'utf8');
}

test('payment.completed serialization is unchanged', () => {
  const event = paymentCompletedEventSchema.parse({
    type: 'payment.completed',
    payment,
    settledAt: payment.createdAt,
  });
  assert.equal(eventNdjsonSerializer.serialize(event), approved('payment.completed'));
});

test('payment.failed serialization is unchanged', () => {
  const event = paymentFailedEventSchema.parse({
    type: 'payment.failed',
    paymentId: payment.id,
    reason: 'insufficient funds',
    failedAt: payment.createdAt,
  });
  assert.equal(eventNdjsonSerializer.serialize(event), approved('payment.failed'));
});
