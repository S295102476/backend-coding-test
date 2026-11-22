import { createHash, timingSafeEqual } from 'node:crypto';
import { GraphQLError } from 'graphql';

const tokenPattern = /^[A-Za-z0-9._~+\/-]+=*$/;
const digest = (value) => createHash('sha256').update(value).digest();

export function createBearerCheck(token) {
  if (typeof token !== 'string' || !tokenPattern.test(token)) {
    throw new Error('API_TOKEN must be a non-empty Bearer token.');
  }

  const expected = digest(token);

  return function requireBearerToken(authorization) {
    const match = /^Bearer +([^ ]+)$/i.exec(authorization ?? '');
    const supplied = match?.[1];

    // Digests have the same length even when the tokens do not.
    if (!supplied || !tokenPattern.test(supplied) || !timingSafeEqual(digest(supplied), expected)) {
      throw new GraphQLError('A valid Bearer token is required.', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401, headers: new Map([['www-authenticate', 'Bearer']]) },
        },
      });
    }
  };
}
