export function buildMakeUpdateApiConfigurationCallback({ displayTextWithSpinner, parseURL, writeFile, unlink, zip, readFile, getLambda }) {
  return function makeUpdateApiConfigurationCallback({ name, config, context }) {
    const lambda = getLambda({ context });
    return async function updateApiConfigurationCallback({ projects }) {
      const { cancel, updateText } = displayTextWithSpinner({ text: `Update ${name} configuration...` });

      try {
        updateText(`Update ${name} configuration[Write Configuration]...`);
        const apiConfig = projects
          .filter(p => !p.config.type || p.config.type === 'compiler')
          .reduce((config, project) => {
            const { name, context } = project;
            const url = parseURL(context.url);
            config.hosts[name] = url.host;
            if (Number.isNaN(Number.parseInt(url.port))) {
              if (url.protocol === 'http:') {
                config.ports[name] = '80';
              } else {
                config.ports[name] = '443';
              }
            } else {
              config.ports[name] = url.port;
            }
            return config;
          }, {
            hosts: {},
            ports: {},
            protocol: 'https',
            unused: true
          });
        await writeFile(`${context.buildPath}/build/configs/lambda-config.json`, JSON.stringify(apiConfig));

        // Remove previous zipfile
        updateText(`Update ${name} configuration[zip]...`);
        await unlink(context.zipfilePath);

        // (Re-)Zip the build directory
        await zip({ name, config, context });

        // Update function code
        updateText(`Update ${name} configuration[Update Function Code]...`);
        const { FunctionName } = context.lambda.Configuration;
        const ZipFile = await readFile(context.zipfilePath);
        await lambda.updateFunctionCode({ FunctionName, ZipFile }).promise();

        // Update function configuration
        updateText(`Update ${name} configuration[Update Function Configuration]...`);
        const Environment = {
          Variables: {
            CONFIG: './../configs/lambda-config.json'
          }
        };
        await lambda.updateFunctionConfiguration({ FunctionName, Environment }).promise();

        updateText(`Update ${name} configuration...`);
        cancel('done');
      } catch (err) {
        cancel('failed');
        throw err;
      }
    };
  };
}

export function buildLambdaDeployer({ displayTextWithSpinner, zip, updateCode, updateApiGateway, makeUpdateApiConfigurationCallback }) {
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

      if (config.type === 'api') {
        context.callbacks.push(makeUpdateApiConfigurationCallback({ name, config, context }));
      }

      context.url = context.api.ApiEndpoint;

      updateText(`Deploy ${name} to AWS Lambda...`);
      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}
