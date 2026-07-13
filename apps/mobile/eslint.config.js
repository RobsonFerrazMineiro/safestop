const expoConfig = require("eslint-config-expo/flat");

// `@safestop/config/eslint` is an ESM-only package. `eslint.config.js` stays
// CommonJS here (no `"type": "module"` in package.json) so Metro and Babel
// can keep loading their own config files with plain `require()`. ESLint
// officially supports a flat config file exporting a Promise for this exact
// case: https://eslint.org/docs/latest/use/configure/configuration-files#exporting-a-promise
module.exports = (async () => {
  const { default: baseConfig } = await import("@safestop/config/eslint");

  return [
    ...baseConfig,
    ...expoConfig,
    {
      ignores: [".expo/**", "expo-env.d.ts"],
    },
    {
      // Metro and this ESLint config file itself are loaded by Node via
      // plain `require()` (CommonJS), so they cannot use `import`.
      files: ["metro.config.js", "eslint.config.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ];
})();
