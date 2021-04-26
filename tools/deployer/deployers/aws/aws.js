export function buildGetIAM({ IAM }) {
  return function getIAM({ context }) {
    return new IAM(context.config.aws);
  };
}

export function buildGetLambda({ Lambda }) {
  return function getLambda({ context }) {
    return new Lambda(context.config.aws);
  };
}

export function buildGetApiGatewayV2({ ApiGatewayV2 }) {
  return function getApiGatewayV2({ context }) {
    return new ApiGatewayV2(context.config.aws);
  };
}
