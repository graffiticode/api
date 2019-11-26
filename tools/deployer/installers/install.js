export default function buildGetCompiler({ gitGetter, localGetter }) {
  return async function getCompiler({ compiler, context }) {
    if (!compiler) {
      throw new Error('invalid compiler');
    }
    const { repository } = compiler;
    if (!repository) {
      throw new Error('invalid compiler.repository');
    }
    const { type } = repository;
    if ('git' === type) {
      return await gitGetter({ repository, context });
    }
    if ('local' === type) {
      return await localGetter({ repository, context });
    }
    throw new Error(`unknown repository type: ${type}`);
  };
}