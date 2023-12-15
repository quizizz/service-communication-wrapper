/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  bail: true,
  clearMocks: true,
  silent: true,
  collectCoverageFrom: ['./src/**/*.{js,ts}'],
  collectCoverage: true,
  coverageReporters: ['json-summary', 'json', 'html'],
  testLocationInResults: true,
  testMatch: ['**/tests/**'],
  json: true,
  reporters: ['jest-junit', 'default'],
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: ['TS151001']
      }
    }],
  },
  rootDir: './',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  maxWorkers: 4,
  maxConcurrency: 4,
  coveragePathIgnorePatterns: [],
};