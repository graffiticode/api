import buildDeployCompiler from './deploy';

describe('deploy', () => {
  it('should reject if invalid compiler', async () => {
    const deployCompiler = buildDeployCompiler({});
    await expect(deployCompiler({})).rejects.toThrow('invalid compiler');
  });
  it('should reject if invalid deploy', async () => {
    const deployCompiler = buildDeployCompiler({});
    await expect(deployCompiler({ compiler: {} })).rejects.toThrow('invalid compiler.deploy');
  });
  it('should reject if unknown type', async () => {
    const deployCompiler = buildDeployCompiler({});
    await expect(deployCompiler({ compiler: { deploy: { type: 'foo' } } })).rejects.toThrow('unknown deploy type: foo');
  });
  it('should call awsLambdaDeployer', async () => {
    const awsLambdaDeployer = jest.fn().mockResolvedValue('foo');
    const deployCompiler = buildDeployCompiler({ awsLambdaDeployer });
    await expect(deployCompiler({ compiler: { deploy: { type: 'aws-lambda' } } })).resolves.toBe('foo');
  });
});