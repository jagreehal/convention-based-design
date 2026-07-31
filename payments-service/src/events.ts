import { z } from 'zod';
import { defineEvent } from 'eventcatalog-generator-zod/define-event';
import { paymentSchema } from './api.ts';

export const paymentCompletedEventSchema = defineEvent(
  {
    id: 'payment.completed',
    version: '1.0.0',
    summary: 'Emitted when a payment settles successfully.',
    producers: ['payments-service'],
    consumers: ['reporter'],
  },
  z.object({
    type: z.literal('payment.completed'),
    payment: paymentSchema,
    settledAt: z.iso.datetime(),
  })
);
export type PaymentCompletedEvent = z.infer<typeof paymentCompletedEventSchema>;

export const paymentFailedEventSchema = defineEvent(
  {
    id: 'payment.failed',
    version: '1.0.0',
    summary: 'Emitted when a payment is declined or errors.',
    producers: ['payments-service'],
    consumers: ['reporter'],
  },
  z.object({
    type: z.literal('payment.failed'),
    paymentId: z.string(),
    reason: z.string(),
    failedAt: z.iso.datetime(),
  })
);
export type PaymentFailedEvent = z.infer<typeof paymentFailedEventSchema>;

export const eventSchemaList = [paymentCompletedEventSchema, paymentFailedEventSchema];

// This is the event stream's real wire adapter. Production and contract tests
// use the same implementation, including the NDJSON record delimiter.
export const eventNdjsonSerializer = {
  name: 'ndjson',
  serialize(value: unknown): string {
    return `${JSON.stringify(value)}\n`;
  },
  deserialize(serialized: string): unknown {
    return JSON.parse(serialized);
  },
};
