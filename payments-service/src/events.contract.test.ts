// Pins the serialized bytes of each event — the JSON Schema check guards the
// shape, this guards the exact wire format consumers parse. First run writes
// __contracts__/<name>.approved.txt; review and commit it.
import { test } from 'node:test';
import { messageContract } from 'autotel-message-contract';
import { paymentCompletedEventSchema, paymentFailedEventSchema } from './events.ts';

const payment = {
  id: 'pay_fixed',
  amount: 42,
  currency: 'GBP' as const,
  status: 'completed' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('payment.completed serialization is unchanged', () => {
  messageContract({ snapshot: 'payment.completed' })
    .given(paymentCompletedEventSchema.parse({ type: 'payment.completed', payment, settledAt: payment.createdAt }))
    .whenSerialized()
    .thenContractIsUnchanged();
});

test('payment.failed serialization is unchanged', () => {
  messageContract({ snapshot: 'payment.failed' })
    .given(paymentFailedEventSchema.parse({ type: 'payment.failed', paymentId: payment.id, reason: 'insufficient funds', failedAt: payment.createdAt }))
    .whenSerialized()
    .thenContractIsUnchanged();
});
