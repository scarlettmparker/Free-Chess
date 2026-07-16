module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^~server/(.*)$': '<rootDir>/server/src/$1',
    '^~$': '<rootDir>/src',
  },
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          target: 'es2020',
        },
      },
    ],
  },
};
