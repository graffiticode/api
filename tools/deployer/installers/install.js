export default function buildInstallProject({ gitInstaller, localInstaller }) {
  return async function installProject({ name, config, context }) {
    if (!config) {
      throw new Error('project must have a config');
    }
    if (!config.install) {
      throw new Error('project config must contain an install property');
    }
    if (!context) {
      throw new Error('project must have a context');
    }
    let { type } = config.install;
    let installer;
    if (!type) {
      type = 'git';
    }
    if ('git' === type) {
      installer = gitInstaller;
    } else if ('local' === type) {
      installer = localInstaller;
    } else {
      throw new Error(`unknown install type: ${type}`);
    }

    await installer({ name, config, context });

    if (!context.installPath) {
      throw new Error(`${type} installer did not add installPath to context`);
    }
  };
}