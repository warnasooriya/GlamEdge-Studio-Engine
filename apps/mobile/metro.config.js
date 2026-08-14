// Learn more https://docs.expo.io/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// pnpm hoists dependencies (e.g. react-native's own "memoize-one") into the
// workspace root via symlinks rather than copying them into this package's
// node_modules — Metro doesn't follow symlinks unless told to, which is why
// modules react-native itself depends on fail to resolve without this.
config.resolver.unstable_enableSymlinks = true;

// Some dependencies (e.g. react-native-calendars, @expo-google-fonts/*) import
// "react"/"react-native" without declaring them as a dependency at all, so
// pnpm can't hoist them to those packages' own scope and Metro's hierarchical
// lookup instead lands on whatever *other* copy pnpm happened to hoist
// ambiguously — in this workspace, apps/web's react@18 instead of this app's
// react@19. That "succeeds" (no resolution error) but produces two separate
// React module instances in one bundle, which breaks every hook with
// "Cannot read properties of null" / "Invalid hook call". Force these
// singleton packages to always resolve to this app's own copy, no matter
// which file is asking.
function getPackageName(moduleName) {
  const segments = moduleName.split("/");
  return moduleName.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}
const singletonPackages = new Set(["react", "react-dom", "react-native"]);

// Metro's symlink support above is still flaky in practice with pnpm's layout —
// which package fails to resolve varies run to run (seen: memoize-one,
// regenerator-runtime, @expo/vector-icons, color), even though every one of
// them resolves fine via plain Node from the importing file's own directory.
// Fall back to Node's own resolution algorithm — context-aware via
// originModulePath, unlike a plain extraNodeModules map — whenever Metro's
// default resolver fails on a bare package name.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (singletonPackages.has(getPackageName(moduleName))) {
    const filePath = require.resolve(moduleName, { paths: [__dirname] });
    return { type: "sourceFile", filePath };
  }
  try {
    return defaultResolveRequest
      ? defaultResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    const isBareSpecifier = !moduleName.startsWith(".") && !path.isAbsolute(moduleName);
    if (isBareSpecifier && context.originModulePath) {
      try {
        const filePath = require.resolve(moduleName, { paths: [path.dirname(context.originModulePath)] });
        return { type: "sourceFile", filePath };
      } catch {
        // fall through to rethrow the original Metro error
      }
    }
    throw error;
  }
};

module.exports = config;
