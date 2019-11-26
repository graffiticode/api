export default function buildDeployCompiler({ awsLambdaDeployer }) {
  return async function deployCompiler({ compiler, context }) {
    if (!compiler) {
      throw new Error('invalid compiler');
    }
    const { deploy } = compiler;
    if (!deploy) {
      throw new Error('invalid compiler.deploy');
    }
    const { type } = deploy;
    if ('aws-lambda' === type) {
      return await awsLambdaDeployer({ compiler, deploy, context });
    }
    throw new Error(`unknown deploy type: ${type}`);
  };
}