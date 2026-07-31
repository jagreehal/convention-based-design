import { z } from 'zod';
import { createPaymentRequestSchema, paymentSchema, problemSchema } from './api.ts';
import { getEventMetadata } from 'eventcatalog-generator-zod/define-event';
import { eventSchemaList } from './events.ts';

const json = (schema: z.ZodType) => z.toJSONSchema(schema, { target: 'openapi-3.0' });

export function buildContracts() {
  // x-eventcatalog carries the defineEvent metadata into the artifact, so
  // aggregators need only the JSON — never this repo's source code.
  const events = Object.fromEntries(
    eventSchemaList.map((schema) => [
      schema.shape.type.value,
      { ...z.toJSONSchema(schema), 'x-eventcatalog': getEventMetadata(schema) },
    ])
  );

  // ponytail: paths/status codes are duplicated by hand in server.ts; adopt
  // spec-driven routing (fastify + zod-openapi, orpc) or contract tests
  // against the running server when the API outgrows two routes
  const openapi = {
    openapi: '3.0.3',
    info: { title: 'Payments Service API', version: '1.0.0' },
    paths: {
      '/payments': {
        post: {
          operationId: 'createPayment',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: json(createPaymentRequestSchema) } },
          },
          responses: {
            '201': {
              description: 'Payment created and settled',
              content: { 'application/json': { schema: json(paymentSchema) } },
            },
            '400': {
              description: 'Invalid request',
              content: { 'application/json': { schema: json(problemSchema) } },
            },
          },
        },
      },
      '/payments/{id}': {
        get: {
          operationId: 'getPayment',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Payment',
              content: { 'application/json': { schema: json(paymentSchema) } },
            },
            '404': {
              description: 'Not found',
              content: { 'application/json': { schema: json(problemSchema) } },
            },
          },
        },
      },
    },
  };

  return { openapi, events };
}
