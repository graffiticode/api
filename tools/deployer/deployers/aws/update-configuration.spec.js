import buildUpdateConfiguration from './update-configuration';

function createAwsFunction(value) {
  return jest.fn().mockReturnValue({ promise: () => Promise.resolve(value) });
}

describe('aws', () => {
  describe('updateConfiguration', () => {
    it('noop', async () => {
      // Arrange
      const func = {};
      const lambda = {
        updateFunctionConfiguration: createAwsFunction(func),
      };
      const getLambda = jest.fn().mockReturnValue(lambda);
      const updateConfiguration = buildUpdateConfiguration({ getLambda });
      const context = {};
      const FunctionName = 'FunctionName';
      const Handler = 'Handler';

      // Act
      await expect(updateConfiguration({ context, FunctionName, Handler })).resolves.toBe();

      // Assert
    });
  });
});