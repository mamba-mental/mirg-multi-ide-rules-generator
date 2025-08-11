module.exports = {
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/backend/src/$1',
      },
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/frontend/**/*.test.tsx', '<rootDir>/frontend/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.setup.ts'],
    },
    {
      displayName: 'e2e',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      testTimeout: 30000,
    },
  ],
  collectCoverageFrom: [
    'backend/src/**/*.{ts,tsx}',
    'frontend/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};