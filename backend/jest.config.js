/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts']
};

// Use a test-specific tsconfig so Jest/ts-jest can compile test files outside src/
module.exports.globals = {
  'ts-jest': {
    tsconfig: 'tsconfig.test.json'
  }
};
