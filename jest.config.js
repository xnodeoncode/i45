/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          target: "ES2020",
          esModuleInterop: true,
          moduleResolution: "node",
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^i45-jslogger$": "<rootDir>/tests/__mocks__/i45-jslogger.ts",
    "^i45-sample-data$": "<rootDir>/tests/__mocks__/i45-sample-data.ts",
  },
  transformIgnorePatterns: ["node_modules/(?!(i45-sample-data|i45-jslogger)/)"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/@types/**",
    "!src/services/cookieService.ts", // Not yet integrated
    "!src/services/indexedDBService.ts", // Not yet integrated
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  verbose: true,
  testTimeout: 10000,
};
