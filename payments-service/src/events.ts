import { z } from 'zod';
import { defineEvent } from './define-event.ts';
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
    consumers: ['reporter', 'dashboard'],
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
