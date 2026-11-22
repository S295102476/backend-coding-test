import { readFile } from 'node:fs/promises';

async function readFixture(name) {
  const path = new URL(`../data/${name}.json`, import.meta.url);
  return JSON.parse(await readFile(path, 'utf8'));
}

function indexBy(records, key = '_id') {
  return new Map(records
    .filter((record) => record[key] != null)
    .map((record) => [record[key], record]));
}

export async function loadData() {
  const [nodes, triggers, responses, actions, templates] = await Promise.all(
    ['node', 'trigger', 'response', 'action', 'resourceTemplate'].map(readFixture),
  );

  return {
    nodesById: indexBy(nodes),
    nodesByCompositeId: indexBy(nodes, 'compositeId'),
    triggersById: indexBy(triggers),
    responsesById: indexBy(responses),
    actionsById: indexBy(actions),
    templatesById: indexBy(templates),
  };
}
