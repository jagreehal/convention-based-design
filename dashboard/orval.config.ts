import { defineConfig } from 'orval';

export default defineConfig({
  payments: {
    input: {
      // The only thing shared with payments-service: its committed contract.
      // In separate repos this is a URL, a submodule, or a fetched CI artifact.
      target: '../payments-service/contracts/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/generated/payments.ts',
      client: 'fetch',
      mock: false,
      baseUrl: 'http://localhost:4000',
    },
  },
});
