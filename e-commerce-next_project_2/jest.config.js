/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.js?(x)"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/app/**/page.js",
    "!src/app/layout.js",
  ],
};

module.exports = config;
