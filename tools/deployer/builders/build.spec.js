import buildBuildCompiler from './build';

describe('build', () => {
  it('should throw if invalid compiler', async () => {
    const buildCompiler = buildBuildCompiler({});
    await expect(buildCompiler({})).rejects.toThrow('invalid compiler');
  });
  it('should throw if invalid build', async () => {
    const buildCompiler = buildBuildCompiler({});
    await expect(buildCompiler({ compiler: {} })).rejects.toThrow('invalid compiler.build');
  });
  it('should throw if unknown type', async () => {
    const buildCompiler = buildBuildCompiler({});
    await expect(buildCompiler({ compiler: { build: { type: 'foo' } } })).rejects.toThrow('unknown build type: foo');
  });
  it('should call npmBuilder', async () => {
    const npmBuilder = jest.fn().mockResolvedValue('foo');
    const buildCompiler = buildBuildCompiler({ npmBuilder });
    await expect(buildCompiler({ compiler: { build: { type: 'npm' } }, context: {} })).resolves.toBe('foo');
  });
});