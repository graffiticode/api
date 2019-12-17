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

const apiAssumeRolePolicyDocument = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Sid: '',
    Effect: 'Allow',
    Principal: {
      Service: [
        'apigateway.amazonaws.com',
        'lambda.amazonaws.com',
      ],
    },
    Action: 'sts:AssumeRole',
  }],
});
const apiPolicyArn = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';

export default function buildAwsLambdaDeployer({ displayTextWithSpinner, delay, fs, zip, IAM, Lambda, ApiGatewayV2 }) {
  const getRole = buildGetRole({ IAM });
  const retryingCreateFunction = buildRetryingCreateFunction({ Lambda, delay, maxAttempts: 5 });
  const updateCode = buildUpdateCode({ fs, Lambda, getRole, retryingCreateFunction });
  const createApiGateway = buildCreateApiGateway({ ApiGatewayV2, getRole });
  return async function awsLambdaDeployer({ name, config, context }) {
    const { cancel, updateText } = displayTextWithSpinner({ text: `Deploy ${name} to AWS Lambda[init]...` });
    try {
      updateText(`Deploy ${name} to AWS[zip]...`);
      await zip({ config, context });

      updateText(`Deploy ${name} to AWS[Lambda]...`);
      await updateCode({ config, context });

      updateText(`Deploy ${name} to AWS[API Gateway]...`);
      await createApiGateway({ config, context });

      updateText(`Deploy ${name} to AWS Lambda...`);
      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}

function buildGetRole({ IAM }) {
  return async function getRole({ context, RoleName, AssumeRolePolicyDocument, PolicyArn }) {
    const iam = new IAM({ region: context.config.aws.region });
    try {
      const { Role } = await iam.createRole({ RoleName, AssumeRolePolicyDocument }).promise();
      await iam.attachRolePolicy({ RoleName, PolicyArn }).promise();
      return Role;
    } catch (err) {
      if (err.code !== 'EntityAlreadyExists') {
        throw err;
      }
      const { Role } = await iam.getRole({ RoleName }).promise();
      return Role;
    }
  };
}

function buildRetryingCreateFunction({ Lambda, maxAttempts, delay }) {
  return async function retryingCreateFunction({ context, params, attempt = 0 }) {
    const lambda = new Lambda({ region: context.config.aws.region });
    try {
      return await lambda.createFunction(params).promise();
    } catch (err) {
      if (err.code === 'InvalidParameterValueException' && attempt < maxAttempts) {
        await delay(err.retryDelay);
        return await retryingCreateFunction({ context, params, attempt: attempt + 1 });
      }
      throw err;
    }
  };
}

function buildUpdateCode({ fs, Lambda, getRole, retryingCreateFunction }) {
  return async function updateCode({ name, config, context }) {
    const lambda = new Lambda({ region: context.config.aws.region });
    const FunctionName = `graffiticode-${name}`;
    const ZipFile = await fs.readFile(context.zipfilePath);
    try {
      await lambda.updateFunctionCode({ FunctionName, ZipFile }).promise();
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
      const functionRole = await getRole({
        context,
        RoleName: `${FunctionName}-lambda-role`,
        AssumeRolePolicyDocument: functionAssumeRolePolicyDocument,
        PolicyArn: functionPolicyArn,
      });
      await retryingCreateFunction({
        context,
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
    const lambda = await lambda.getFunction({ FunctionName }).promise();
    context.lambda = lambda;
  };
}

function buildCreateApiGateway({ ApiGatewayV2, getRole }) {
  return async function createApiGateway({ context }) {
    const apiGatewayV2 = new ApiGatewayV2({ region: context.config.aws.region });
    const Name = `${context.lambda.Configuration.FunctionName}-API`;
    const apis = await apiGatewayV2.getApis({}).promise();
    context.api = apis.Items.find((api) => api.Name === Name);
    if (!context.api) {
      const Role = await getRole({
        context,
        RoleName: `${Name}-role`,
        AssumeRolePolicyDocument: apiAssumeRolePolicyDocument,
        PolicyArn: apiPolicyArn,
      });
      context.api = await apiGatewayV2.createApi({
        Name,
        Description: `The API Gateway for lambda function ${context.lambda.Configuration.FunctionName}`,
        ProtocolType: 'HTTP',
        Target: context.lambda.Configuration.FunctionArn,
        CredentialsArn: Role.Arn,
      }).promise();
    }
    return context.api;
  };
}
