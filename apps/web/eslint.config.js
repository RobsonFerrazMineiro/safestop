import baseConfig from "@safestop/config/eslint";
import nextConfig from "eslint-config-next";

const config = [...baseConfig, ...nextConfig];

export default config;
