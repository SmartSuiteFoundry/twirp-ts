import { createDefaultEsmPreset } from "ts-jest";

/** @type {import('jest').Config} */
export default {
  ...createDefaultEsmPreset({ tsconfig: "tsconfig.test.json" }),
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverageFrom: ["src/**/*.ts"],
  // TypeScript sources import with the .js extension that NodeNext requires;
  // map it back so Jest resolves the .ts file.
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
