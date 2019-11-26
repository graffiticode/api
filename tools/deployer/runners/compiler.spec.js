import buildHandleCompiler from './compiler';

describe('compiler', () => {
  it('should call get, build, and deploy compiler', async () => {
    // Arrange
    const getCompiler = jest.fn().mockResolvedValue();
    const buildCompiler = jest.fn().mockResolvedValue();
    const deployCompiler = jest.fn().mockResolvedValue();
    const handleCompiler = buildHandleCompiler({ getCompiler, buildCompiler, deployCompiler });
    const compiler = { language: 'foo' };
    const context = {};

    // Act
    await expect(handleCompiler({ compiler, context })).resolves.toBe();

    // Assert
    expect(getCompiler).toHaveBeenCalledWith({ compiler, context });
    expect(buildCompiler).toHaveBeenCalledWith({ compiler, context });
    expect(deployCompiler).toHaveBeenCalledWith({ compiler, context });
  });
});