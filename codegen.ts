import type { CodegenConfig } from '@graphql-codegen/cli';

const schemaUrl = process.env.GRAPHQL_SCHEMA_URL ?? 'http://localhost:8083/graphql/schema';

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [schemaUrl]: {
        handleAsSDL: true,
      },
    },
  ],
  documents: 'graphql/operations/**/*.graphql',
  generates: {
    'graphql/schema.graphql': {
      plugins: ['schema-ast'],
    },
    'src/generated/': {
      preset: 'client',
      plugins: [],
      config: {
        scalars: {
          DateTime: { input: 'string', output: 'string' },
          JSON: { input: 'unknown', output: 'unknown' },
          Long: { input: 'number', output: 'number' },
        },
      },
    },
  },
};

export default config;
