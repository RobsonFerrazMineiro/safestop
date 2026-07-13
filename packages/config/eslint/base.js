import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** File patterns for Node.js tooling configs (CommonJS or ESM). */
const nodeConfigFiles = [
  "**/*.config.js",
  "**/babel.config.js",
  "**/metro.config.js",
  "**/eslint.config.js",
];

/** Node globals for config files loaded by tooling (babel, metro, eslint, etc.). */
const nodeConfigGlobals = {
  __dirname: "readonly",
  __filename: "readonly",
  Buffer: "readonly",
  exports: "writable",
  global: "readonly",
  module: "writable",
  process: "readonly",
  require: "readonly",
};

/**
 * Minimal shared ESLint preset for the SafeStop monorepo.
 *
 * Covers JavaScript and TypeScript source files. Framework-specific rules
 * (React, Next.js, React Native) will be added when the respective apps
 * are initialized.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.tsbuildinfo",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: nodeConfigFiles,
    languageOptions: {
      globals: nodeConfigGlobals,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
