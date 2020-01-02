import buildGetRole from './get-role';

function createAwsFunction(value) {
  return jest.fn().mockReturnValue({ promise: () => Promise.resolve(value) });
}

describe('aws', () => {
  describe('getRole', () => {
    it('smoke', async () => {
      // Arrange
      const role = {};
      const iam = {
        attachRolePolicy: createAwsFunction(),
        createRole: createAwsFunction(role),
        getRole: createAwsFunction(role),
      }
      const getIAM = jest.fn().mockReturnValue(iam);
      const RoleName = 'RoleName';
      const PolicyArn = 'PolicyArn';
      const AssumeRolePolicyDocument = 'AssumeRolePolicyDocument';
      const getRole = buildGetRole({ getIAM });
      
      // Act
      await expect(getRole({ RoleName, PolicyArn, AssumeRolePolicyDocument })).resolves.toBe();

      // Assert
    });
  });
});