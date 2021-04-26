export default function makeLambdaHandler({ awsServerlessExpress, app }) {
  const server = awsServerlessExpress.createServer(app);
  return function lambdaHandler(event, context) {
    awsServerlessExpress.proxy(server, event, context);
  };
}