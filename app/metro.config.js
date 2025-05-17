const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ Fix for redux-saga and other CommonJS packages
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
