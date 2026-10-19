/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverageFrom: ["src/**/*.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: { "^.+\\.ts$": "@swc/jest" },
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
