import { createPayment, getPayment } from './generated/payments.ts';

const created = await createPayment({ amount: 42, currency: 'GBP' });
if (created.status !== 201) throw new Error(`createPayment failed: ${JSON.stringify(created)}`);
console.log(`created payment ${created.data.id}: ${created.data.amount} ${created.data.currency} (${created.data.status})`);

const fetched = await getPayment(created.data.id);
if (fetched.status !== 200) throw new Error(`getPayment failed: ${JSON.stringify(fetched)}`);
console.log(`fetched payment ${fetched.data.id}, status ${fetched.data.status}`);
