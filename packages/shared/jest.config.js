module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/'],
  // The shared code is imported by apps through the @shared alias; tests use relative imports.
  moduleNameMapper: { '^@shared/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/testing/**', '!src/**/__tests__/**', '!src/**/*.d.ts'],
  // `npm run test:coverage` fails if shared logic drifts back to being untested.
  coverageThreshold: { global: { statements: 95, branches: 90, functions: 90, lines: 95 } },
};
