import { readFile } from 'node:fs/promises';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createBearerCheck } from './auth.js';
import { loadData } from './data.js';
import { resolvers } from './resolvers.js';

export async function startApi({ token, host = '127.0.0.1', port = 4000 }) {
  const requireBearerToken = createBearerCheck(token);
  const [typeDefs, data] = await Promise.all([
    readFile(new URL('./schema.graphql', import.meta.url), 'utf8'),
    loadData(),
  ]);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginLandingPageDisabled()],
    includeStacktraceInErrorResponses: false,
  });
  const { url } = await startStandaloneServer(server, {
    listen: { host, port },
    context: async ({ req }) => {
      requireBearerToken(req.headers.authorization);
      return { data };
    },
  });

  return { server, url };
}
