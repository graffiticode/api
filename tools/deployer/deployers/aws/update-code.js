const functionAssumeRolePolicyDocument = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Effect: 'Allow',
    Principal: {
      Service: [
        'lambda.amazonaws.com',
      ],
    },
    Action: 'sts:AssumeRole'
  }],
});
const functionPolicyArn = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';

function buildRetryingCreateFunction({ maxAttempts, delay }) {
  return async function retryingCreateFunction({ lambda, params, attempt = 0 }) {
    try {
      return await lambda.createFunction(params).promise();
    } catch (err) {
      if (err.code === 'InvalidParameterValueException' && attempt < maxAttempts) {
        await delay(err.retryDelay);
        return await retryingCreateFunction({ lambda, params, attempt: attempt + 1 });
      }
      throw err;
    }
  };
}

export default function buildUpdateCode({ getLambda, getRole, readFile, delay }) {
  const retryingCreateFunction = buildRetryingCreateFunction({ maxAttempts: 5, delay })
  return async function updateCode({ name, config, context }) {
    const lambda = getLambda({ context });
    const FunctionName = `graffiticode-lambda-${name}`;
    const ZipFile = await readFile(context.zipfilePath);
    try {
      await lambda.updateFunctionCode({ FunctionName, ZipFile }).promise();
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
      const functionRole = await getRole({
        context,
        RoleName: `${FunctionName}-role`,
        AssumeRolePolicyDocument: functionAssumeRolePolicyDocument,
        PolicyArn: functionPolicyArn,
      });
      await retryingCreateFunction({
        lambda,
        params: {
          FunctionName,
          Code: {
            ZipFile,
          },
          Handler: config.deploy.handler,
          Role: functionRole.Arn,
          Runtime: 'nodejs12.x',
        }
      });
    }
    context.lambda = await lambda.getFunction({ FunctionName }).promise();
  };
}
