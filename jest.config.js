// jest.config.js
const nextJest = require('next/jest')();

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports (e.g. CSS Modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1', // If you need to import from app directory
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/', // Ignore E2E tests for Jest
    '<rootDir>/tests/api/', // Ignore API tests for Jest if Supertest runs them separately or if they need special setup
  ],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
    '!src/app/api/**/*.ts', // Exclude API routes from Jest coverage if tested by Supertest
    '!src/lib/wix-client.ts', // Often excluded if it's mostly SDK init
    '!src/ai/**/*', // Exclude AI related files if not unit tested
    '!src/components/ui/**/*', // ShadCN UI components often excluded unless customized heavily
  ],
  coverageThreshold: {
    global: { // Example thresholds, adjust to your project's goals
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  // reporters: [
  //   "default",
  //   ["jest-html-reporters", {
  //     "publicPath": "./html-report",
  //     "filename": "report.html",
  //     "expand": true
  //   }]
  // ] // Optional: for HTML reports
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
