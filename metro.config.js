const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude web platform from building SQLite modules
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;
