import buildAwsLambdaDeployer from './aws-lambda';

describe('aws-lambda', () => {
  let cancel;
  let updateText;
  let displayTextWithSpinner;
  let zip;
  let awsLambdaDeployer;
  beforeEach(() => {
    cancel = jest.fn();
    updateText = jest.fn();
    displayTextWithSpinner = jest.fn().mockReturnValue({cancel, updateText});
    zip = jest.fn().mockResolvedValue();
    awsLambdaDeployer = buildAwsLambdaDeployer({displayTextWithSpinner, zip});
  });

  it.skip('noop', async () => {
    // Arrange
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

    // Act
    await expect(awsLambdaDeployer(project)).resolves.toBe();

    // Assert
  });
});