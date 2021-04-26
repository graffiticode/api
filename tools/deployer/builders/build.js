export default function buildBuildCompiler({ npmBuilder }) {
  return async function buildCompiler({ name, config, context }) {
    if (!config) {
      throw new Error('project must have a config');
    }
    if (!context) {
      throw new Error('project must have a context');
    }
    if (!context.installPath) {
      throw new Error(`context must have an installPath`);
    }
    const { build = {} } = config;
    let { type = 'npm' } = build;

    let builder;
    if ('npm' === type) {
      builder = npmBuilder;
    } else {
      throw new Error(`unknown builder type: ${type}`);
    }

    await builder({ name, config, context });

    if (!context.buildPath) {
      throw new Error(`${type} builder did not add buildPath to context`);
    }
  };
}