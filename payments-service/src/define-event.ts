import type { z } from 'zod';

export interface EventMetadata {
  id?: string;
  version?: string;
  name?: string;
  summary?: string;
  producers?: string[];
  consumers?: string[];
  owners?: string[];
}

// Symbol.for uses the global symbol registry, so eventcatalog-generator-zod's
// scanner reads this metadata without this service depending on the catalog.
const EVENT_META = Symbol.for('eventcatalog-generator-zod:meta');

export function defineEvent<T extends z.ZodType>(meta: EventMetadata, schema: T): T {
  (schema as Record<symbol, unknown>)[EVENT_META] = meta;
  return schema;
}
