import { JSONValue, Long } from './scalars.js';

function linkedRecords(ids, index) {
  return ids?.map((id) => index.get(id) ?? null) ?? null;
}

function actionIds(node) {
  const lists = [node.preActions, node.actions, node.postActions];
  if (lists.every((list) => list == null)) return null;

  // The schema has one action list, while the data distinguishes phases.
  return [...new Set(lists.flatMap((list) => list ?? []))];
}

function resourceTemplate(record, _args, { data }) {
  return data.templatesById.get(record.resourceTemplateId) ?? null;
}

function templateCreatedAt({ createdAt, _id }) {
  if (createdAt != null) return createdAt;
  // Two fixtures only have an ObjectId; its first four bytes store epoch seconds.
  if (/^[a-f\d]{24}$/i.test(_id)) return Number.parseInt(_id.slice(0, 8), 16) * 1000;
  return null;
}

export const resolvers = {
  Long,
  JSON: JSONValue,
  Query: {
    node: (_parent, { nodeId }, { data }) => data.nodesById.get(nodeId) ?? null,
  },
  NodeObject: {
    parentIds: (node) => node.parents ?? null,
    parents: (node, _args, { data }) => linkedRecords(node.parents, data.nodesByCompositeId),
    triggerId: (node) => node.trigger ?? null,
    trigger: (node, _args, { data }) => data.triggersById.get(node.trigger) ?? null,
    responseIds: (node) => node.responses ?? null,
    responses: (node, _args, { data }) => linkedRecords(node.responses, data.responsesById),
    actionIds,
    actions: (node, _args, { data }) => linkedRecords(actionIds(node), data.actionsById),
  },
  Action: { resourceTemplate },
  Trigger: { resourceTemplate },
  ResourceTemplate: { createdAt: templateCreatedAt },
  ResponseLocaleGroup: {
    localeGroupId: (group) => group.localeGroup ?? null,
  },
};
