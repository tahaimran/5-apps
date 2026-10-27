// TEMPORARY (store screenshots via web, do not commit). Each app's temp metro.config.js calls this.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
module.exports = (dir, extra = []) => {
  const config = getDefaultConfig(dir);
  const STUB = path.join(__dirname, 'stub.js');
  const WIDGET = path.join(__dirname, 'widget-shim.js');
  const NATIVE = [/^react-native-google-mobile-ads/, /^expo-notifications/, /^expo-task-manager/, /^expo-background-task/, /^expo-intent-launcher/, /^expo-store-review/, ...extra];
  const prev = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (ctx, name, platform) => {
    if (platform === 'web' && /^react-native-android-widget/.test(name)) return { type: 'sourceFile', filePath: WIDGET };
    if (platform === 'web' && NATIVE.some((r) => r.test(name))) return { type: 'sourceFile', filePath: STUB };
    return prev ? prev(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
  };
  return config;
};
