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
        await delay(err.retryDelay * 1000);
        return await retryingCreateFunction({ lambda, params, attempt: attempt + 1 });
      }
      err.attempt = attempt;
      err.maxAttempts = maxAttempts;
      throw err;
    }
  };
}

export default function buildUpdateCode({ getLambda, getRole, updateConfiguration, readFile, delay }) {
  const retryingCreateFunction = buildRetryingCreateFunction({ maxAttempts: 5, delay })
  return async function updateCode({ name, config, context }) {
    const lambda = getLambda({ context });
    const FunctionName = `graffiticode-lambda-${name}`;
    const RoleName = `${FunctionName}-role`;
    const Tags = {
      'graffiticode': '',
    };
    const functionRole = await getRole({
      context,
      RoleName,
      AssumeRolePolicyDocument: functionAssumeRolePolicyDocument,
      PolicyArn: functionPolicyArn,
    });
    const Handler = config.deploy.handler;
    const Role = functionRole.Arn;
    const ZipFile = await readFile(context.zipfilePath);
    try {
      await lambda.updateFunctionCode({ FunctionName, ZipFile }).promise();
      await lambda.updateFunctionConfiguration({ FunctionName, Handler, Role }).promise();
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
      await retryingCreateFunction({
        lambda,
        params: {
          FunctionName,
          Code: {
            ZipFile,
          },
          Handler,
          Role,
          Runtime: 'nodejs12.x',
          Tags,
        }
      });
    }
    context.lambda = await lambda.getFunction({ FunctionName }).promise();
  };
}
