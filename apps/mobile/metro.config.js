const { getDefaultConfig } = require("expo/metro-config");

// Expo (SDK 52+) detects and configures pnpm workspaces automatically —
// no manual `watchFolders` / `resolver.nodeModulesPaths` needed here.
// See: https://docs.expo.dev/guides/monorepos/
const config = getDefaultConfig(__dirname);

module.exports = config;
