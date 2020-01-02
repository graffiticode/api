export default function buildLambdaDeployer({ displayTextWithSpinner, zip, updateCode, updateApiGateway }) {
  return async function lambdaDeployer({ name, config, context }) {
    const { cancel, updateText } = displayTextWithSpinner({ text: `Deploy ${name} to AWS Lambda[init]...` });
    try {
      updateText(`Deploy ${name} to AWS[zip]...`);
      await zip({ name, config, context });

      updateText(`Deploy ${name} to AWS[Lambda]...`);
      await updateCode({ name, config, context });

      updateText(`Deploy ${name} to AWS[API Gateway]...`);
      const Target = context.lambda.Configuration.FunctionArn;
      const TargetName = context.lambda.Configuration.FunctionName;
      await updateApiGateway({ context, Target, TargetName });

      updateText(`Deploy ${name} to AWS Lambda...`);
      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}
