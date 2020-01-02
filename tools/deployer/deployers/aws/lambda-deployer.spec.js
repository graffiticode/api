import buildLambdaDeployer from './lambda-deployer';

describe('aws-lambda', () => {
  it('noop', async () => {
    // Arrange
    const cancel = jest.fn().mockReturnValue();
    const updateText = jest.fn().mockReturnValue();
    const displayTextWithSpinner = jest.fn().mockReturnValue({ cancel, updateText });
    const zip = jest.fn().mockResolvedValue();
    const updateCode = jest.fn().mockImplementation(() => {
      project.context.lambda = {
        Configuration: {
          FunctionArn: 'FunctionArn',
          FunctionName: 'FunctionName',
        }
      };
      return Promise.resolve();
    });
    const updateApiGateway = jest.fn().mockResolvedValue();
    const project = {
      name: 'foo',
      config: {
        deploy: {}
      },
      context: {
        config: {
          aws: {}
        },
        installPath: '/tmp/install',
        buildPath: '/tmp/build',
      },
    };
    const lambdaDeployer = buildLambdaDeployer({ displayTextWithSpinner, zip, updateCode, updateApiGateway });

    // Act
    await expect(lambdaDeployer(project)).resolves.toBe();

    // Assert
  });
});