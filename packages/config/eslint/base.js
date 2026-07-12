import js from "@eslint/js";
import tseslint from "typescript-eslint";

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
);
