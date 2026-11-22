import { GraphQLError, GraphQLScalarType } from 'graphql';

// The schema uses both scalars only in output fields.
export const Long = new GraphQLScalarType({
  name: 'Long',
  description: 'An integer that JavaScript can represent exactly. Timestamps are in milliseconds.',
  serialize(value) {
    if (!Number.isSafeInteger(value)) {
      throw new GraphQLError('Long expects a safe integer.');
    }
    return value;
  },
});

export const JSONValue = new GraphQLScalarType({
  name: 'JSON',
  description: 'A JSON value from the data source.',
  serialize: (value) => value,
});
