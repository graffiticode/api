import buildUpdateApiGateway from './update-api-gateway';

function createAwsFunction(value) {
  return jest.fn().mockReturnValue({ promise: () => Promise.resolve(value) });
}

describe('aws', () => {
  describe('updateApiGateway', () => {
    it('noop', async () => {
      // Arrange
      const apis = { Items: [] };
      const api = {};
      const apiGatewayV2 = {
        createApi: createAwsFunction(api),
        getApis: createAwsFunction(apis),
        getStages: createAwsFunction({ Items: [] }),
        updateStage: createAwsFunction(),
      };
      const getApiGatewayV2 = jest.fn().mockReturnValue(apiGatewayV2);
      const role = {};
      const getRole = createAwsFunction(role);
      const context = {};
      const Target = 'Target';
      const TargetName = 'TargetName';
      const updateApiGateway = buildUpdateApiGateway({ getApiGatewayV2, getRole });

      // Act
      await expect(updateApiGateway({ context, Target, TargetName })).resolves.toBe();

      // Assert
    });
  });
});