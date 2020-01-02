export default function buildUpdateConfiguration({ getLambda }) {
  return async function updateConfiguration({ context, Environment, FunctionName, Handler, Role }) {
    const lambda = getLambda({ context });
    await lambda.updateFunctionConfiguration({ FunctionName, Environment, Handler, Role }).promise();
  };
}