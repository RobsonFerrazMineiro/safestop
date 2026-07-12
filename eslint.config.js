import baseConfig from "@safestop/config/eslint";

export default [
  ...baseConfig,
  {
    ignores: ["reference/**", ".husky/**", "pnpm-lock.yaml"],
  },
];
