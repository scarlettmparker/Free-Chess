module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^~server/(.*)$': '<rootDir>/server/src/$1',
    '^~$': '<rootDir>/src',
  },
};
