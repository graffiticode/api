import buildUpdateCode from './update-code';

function createAwsFunction(value) {
  return jest.fn().mockReturnValue({ promise: () => Promise.resolve(value) });
}

describe('aws', () => {
  describe('updateCode', () => {
    it('noop', async () => {
      // Arrange
      const func = {};
      const lambda = {
        createFunction: createAwsFunction(func),
        getFunction: createAwsFunction(func),
        updateFunctionCode: createAwsFunction(func),
        updateFunctionConfiguration: createAwsFunction(func),
      };
      const getLambda = jest.fn().mockReturnValue(lambda);
      const role = {};
      const getRole = createAwsFunction(role);
      const readFile = jest.fn().mockResolvedValue();
      const delay = jest.fn().mockResolvedValue();
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
          zipfilePath: '/tmp/build/function.zip',
        },
      };
      const updateCode = buildUpdateCode({ getLambda, getRole, readFile, delay });

      // Act
      await expect(updateCode(project)).resolves.toBe();

      // Assert
    });
  });
});