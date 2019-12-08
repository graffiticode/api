import buildGetCompiler from './install';

describe('get', () => {
  it('should throw if no compiler is given', async () => {
    const getCompiler = buildGetCompiler({});
    await expect(getCompiler({})).rejects.toThrow('invalid compiler');
  });
  it('should throw if no repository is given', async () => {
    const getCompiler = buildGetCompiler({});
    await expect(getCompiler({ compiler: {} })).rejects.toThrow('invalid compiler.repository');
  });
  it('should throw if unknown type is given', async () => {
    const getCompiler = buildGetCompiler({});
    await expect(getCompiler({ compiler: { repository: { type: 'foo' } } })).rejects.toThrow('unknown repository type: foo');
  });
  it('should call gitGetter for git repository', async () => {
    const gitGetter = jest.fn().mockResolvedValue('foo');
    const getCompiler = buildGetCompiler({ gitGetter });
    await expect(getCompiler({ compiler: { repository: { type: 'git' } } })).resolves.toBe('foo');
  });
  it('should call localGetter for local repository', async () => {
    const localGetter = jest.fn().mockResolvedValue('foo');
    const getCompiler = buildGetCompiler({ localGetter });
    await expect(getCompiler({ compiler: { repository: { type: 'local' } } })).resolves.toBe('foo');
  });
});