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

export default function buildUpdateApiGateway({ getApiGatewayV2, getRole }) {
  return async function updateApiGateway({ context, Target, TargetName }) {
    const apiGatewayV2 = getApiGatewayV2({ context });
    const Name = `${TargetName}-API`;
    const apis = await apiGatewayV2.getApis({}).promise();
    let api = apis.Items.find((api) => api.Name === Name);
    if (!api) {
      const Role = await getRole({
        context,
        RoleName: `${Name}-role`,
        AssumeRolePolicyDocument: apiAssumeRolePolicyDocument,
        PolicyArn: apiPolicyArn,
      });
      api = await apiGatewayV2.createApi({
        Name,
        Description: `The API Gateway for lambda function ${TargetName}`,
        ProtocolType: 'HTTP',
        Target,
        CredentialsArn: Role.Arn,
        Tags: {
          'graffiticode': '',
        },
      }).promise();
    }
    context.api = api;

    const { ApiId } = api;
    const stages = await apiGatewayV2.getStages({ ApiId }).promise();
    const stage = stages.Items.find((stage) => stage.ApiGatewayManaged);
    if (stage) {
      const { StageName } = stage;
      await apiGatewayV2.updateStage({
        ApiId,
        StageName,
        DefaultRouteSettings: {
          DetailedMetricsEnabled: true,
        },
      }).promise();
    }
  };
}