export default function buildDeployProject({ lambdaDeployer }) {
  return async function deployProject({ name, config, context }) {
    if (!config) {
      throw new Error('project must have a config');
    }
    if (!context) {
      throw new Error('project must have a context');
    }
    if (!context.installPath) {
      throw new Error(`context must have an installPath`);
    }
    if (!context.buildPath) {
      throw new Error(`context must have an buildPath`);
    }

    const { deploy = {} } = config;
    const { type = 'aws-lambda' } = deploy;

    let deployer;
    if ('aws-lambda' === type) {
      deployer = lambdaDeployer;
    } else {
      throw new Error(`unknown deploy type: ${type}`);
    }

    await deployer({ name, config, context });
  };
}