import { startApi } from './server.js';

const demoToken = 'backend-test-demo-token';
const host = process.env.HOST ?? '127.0.0.1';
const token = process.env.API_TOKEN ?? demoToken;
const portValue = process.env.PORT ?? '4000';

try {
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || port > 65535) {
    throw new Error('PORT must be an integer from 0 to 65535.');
  }
  if (token === demoToken && !['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new Error('Set a custom API_TOKEN to listen outside localhost.');
  }

  const { url } = await startApi({ token, host, port });
  console.log(`GraphQL API listening at ${url}`);
} catch (error) {
  console.error(`Could not start the GraphQL API: ${error.message}`);
  process.exitCode = 1;
}
