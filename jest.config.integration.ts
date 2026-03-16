import type { Config } from "jest";

const config: Config = {
  // ESM mode is required because the Prisma 7 generated client uses import.meta.url.
  // Run with: node --experimental-vm-modules node_modules/.bin/jest --config jest.config.integration.ts
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/integration/**/*.test.ts"],
  globalSetup: "<rootDir>/__tests__/integration/setup/globalSetup.js",
  globalTeardown: "<rootDir>/__tests__/integration/setup/globalTeardown.js",
  setupFiles: ["<rootDir>/__tests__/integration/setup/setEnv.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react",
          module: "ESNext",
          moduleResolution: "bundler",
        },
      },
    ],
  },
};

export default config;
