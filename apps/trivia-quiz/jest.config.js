module.exports = {
  preset: 'jest-expo',
  testTimeout: 30000,
  testPathIgnorePatterns: ['/node_modules/', '/android/'],
  moduleNameMapper: {
    // Lucide's react-native export is ESM; Jest gets the CommonJS build of each icon.
    '^lucide-react-native/icons/(.*)$': '<rootDir>/../../node_modules/lucide-react-native/dist/cjs/icons/$1.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
};
