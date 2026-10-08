module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/android/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1' },
};
