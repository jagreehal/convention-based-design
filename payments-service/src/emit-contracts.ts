import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildContracts } from './contracts.ts';

const contractsDir = fileURLToPath(new URL('../contracts', import.meta.url));
const { openapi, events } = buildContracts();

// full replacement, so retiring an event retires its artifact
rmSync(`${contractsDir}/events`, { recursive: true, force: true });
mkdirSync(`${contractsDir}/events`, { recursive: true });
writeFileSync(`${contractsDir}/openapi.json`, JSON.stringify(openapi, null, 2) + '\n');
for (const [type, schema] of Object.entries(events)) {
  writeFileSync(`${contractsDir}/events/${type}.json`, JSON.stringify(schema, null, 2) + '\n');
}

console.log(`Wrote openapi.json and ${Object.keys(events).length} event schema(s) to contracts/`);
