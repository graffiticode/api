export default function buildBuildCompiler({ npmBuilder }) {
  return async function buildCompiler({ compiler, context }) {
    if (!compiler) {
      throw new Error('invalid compiler');
    }
    const { build } = compiler;
    if (!build) {
      throw new Error('invalid compiler.build');
    }
    const { type } = build;
    if ('npm' === type) {
      return await npmBuilder({ build, context });
    }
    throw new Error(`unknown build type: ${type}`);
  };
}