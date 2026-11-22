import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startApi } from '../src/server.js';

const token = 'integration-test-token';
const emailNodeId = '6297172e70a0c165b989cd10';
let api;

before(async () => {
  api = await startApi({ port: 0, host: '127.0.0.1', token });
});

after(async () => {
  await api?.server.stop();
});

async function request(query, { variables, authorization = `Bearer ${token}` } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (authorization !== null) headers.authorization = authorization;

  const response = await fetch(api.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  return { status: response.status, body: await response.json() };
}

test('rejects requests without a valid Bearer token', async (t) => {
  for (const [name, authorization] of [
    ['missing header', null],
    ['wrong scheme', `Basic ${token}`],
    ['wrong token', 'Bearer invalid-token'],
  ]) {
    await t.test(name, async () => {
      const { status, body } = await request('{ node { _id } }', { authorization });

      assert.equal(status, 401);
      assert.equal(body.errors[0].extensions.code, 'UNAUTHENTICATED');
      assert.equal(body.data, undefined);
    });
  }
});

test('resolves the email node and its related objects from the fixture IDs', async () => {
  const { status, body } = await request(
    `query EmailNode($id: ID!) {
      node(nodeId: $id) {
        _id
        name
        createdAt
        parentIds
        parents {
          _id
          compositeId
          name
          parents { name }
        }
        triggerId
        trigger {
          _id
          name
          resourceTemplateId
          resourceTemplate { _id name createdAt updatedAt schema }
        }
        responseIds
        responses {
          _id
          platforms {
            integrationId
            build
            localeGroups { localeGroupId variations { name responses } }
          }
        }
        actionIds
        actions { _id name resourceTemplate { name createdAt } }
      }
    }`,
    { variables: { id: emailNodeId }, authorization: `bEaReR ${token}` },
  );

  assert.equal(status, 200);
  assert.equal(body.errors, undefined, JSON.stringify(body.errors));
  const { node } = body.data;
  assert.equal(node._id, emailNodeId);
  assert.equal(node.name, "User's Email");
  assert.equal(node.createdAt, 1654069038783);

  assert.deepEqual(node.parentIds, ['rCMUtmL3aOULyqBL']);
  assert.deepEqual(node.parents, [{
    _id: '6297164810f52524ba1a9300',
    compositeId: 'rCMUtmL3aOULyqBL',
    name: 'Sign up Webinar',
    parents: [{ name: 'Greeting Message' }],
  }]);

  assert.equal(node.triggerId, '6297176c10f525b8a81a9304');
  assert.equal(node.trigger._id, node.triggerId);
  assert.equal(node.trigger.name, 'Email Trigger');
  const { resourceTemplate } = node.trigger;
  assert.equal(resourceTemplate._id, node.trigger.resourceTemplateId);
  assert.equal(resourceTemplate.name, 'Predefined Triggers');
  // The fixture omits createdAt; recover its second-precision value from the ObjectId.
  assert.equal(resourceTemplate.createdAt, 1642707488000);
  assert.equal(resourceTemplate.updatedAt, 1727122901547);
  assert.equal(resourceTemplate.schema.properties.IndividualTriggers.properties.Email.type, 'boolean');

  assert.deepEqual(node.responseIds, ['6297189510f525833b1a9305']);
  assert.deepEqual(node.responses, [{
    _id: node.responseIds[0],
    platforms: [{
      integrationId: 'woztell-essential-pack',
      build: 1,
      localeGroups: [{
        localeGroupId: 'default',
        variations: [{
          name: 'Standard',
          responses: [{
            type: 'TEXT',
            text: 'Thank you for signing up for our webinar!',
            id: '8Y4Qw8A8',
            transform: '',
          }],
        }],
      }],
    }],
  }]);

  assert.deepEqual(node.actionIds, ['6530933e6a1690d2f0c78a92']);
  assert.deepEqual(node.actions, [{
    _id: node.actionIds[0],
    name: 'Send Email Action',
    resourceTemplate: { name: 'Send Email', createdAt: 1654758039590 },
  }]);
});

test('returns null for omitted, null and unknown node IDs', async () => {
  const { status, body } = await request(`{
    omitted: node { _id }
    explicitNull: node(nodeId: null) { _id }
    unknown: node(nodeId: "not-a-node") { _id }
  }`);

  assert.equal(status, 200);
  assert.deepEqual(body, { data: { omitted: null, explicitNull: null, unknown: null } });
});

test('preserves empty and null relationships from the fixtures', async () => {
  const { status, body } = await request(`{
    root: node(nodeId: "6296be3470a0c1052f89cccb") {
      parents { _id }
      parentIds
    }
    unconfigured: node(nodeId: "62971b3470a0c1803c89cd15") {
      trigger { _id }
      triggerId
      responses { _id }
      responseIds
      actions { _id }
      actionIds
    }
  }`);

  assert.equal(status, 200);
  assert.deepEqual(body, { data: {
    root: { parents: [], parentIds: [] },
    unconfigured: {
      trigger: null,
      triggerId: null,
      responses: null,
      responseIds: null,
      actions: null,
      actionIds: null,
    },
  } });
});
