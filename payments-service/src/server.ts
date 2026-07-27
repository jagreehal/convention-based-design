import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPaymentRequestSchema, type Payment } from './api.ts';
import { eventNdjsonSerializer, paymentCompletedEventSchema } from './events.ts';

const eventLog = process.env.EVENT_LOG ?? fileURLToPath(new URL('../events.ndjson', import.meta.url));
const payments = new Map<string, Payment>();

// The producer validates its own events against the same schema the
// contract artifacts are generated from — it cannot emit off-contract.
function emit(event: unknown) {
  appendFileSync(eventLog, eventNdjsonSerializer.serialize(paymentCompletedEventSchema.parse(event)));
}

const server = createServer(async (req, res) => {
  const reply = (status: number, body: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'POST' && req.url === '/payments') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return reply(400, { error: 'invalid JSON' });
    }
    const parsed = createPaymentRequestSchema.safeParse(body);
    if (!parsed.success) return reply(400, { error: parsed.error.message });

    // ponytail: settles synchronously; make status 'processing' + async settle when a real PSP arrives
    const payment: Payment = {
      id: randomUUID(),
      ...parsed.data,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    payments.set(payment.id, payment);
    emit({ type: 'payment.completed', payment, settledAt: payment.createdAt });
    return reply(201, payment);
  }

  const match = req.method === 'GET' && req.url?.match(/^\/payments\/([^/]+)$/);
  if (match) {
    const payment = payments.get(match[1]);
    return payment ? reply(200, payment) : reply(404, { error: 'payment not found' });
  }

  reply(404, { error: 'not found' });
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => console.log(`payments-service listening on :${port}, events → ${eventLog}`));
