export default function buildHandleCompiler({ getCompiler, buildCompiler, deployCompiler }) {
  return async function handleCompiler({ compiler, context }) {
    await getCompiler({ compiler, context });
    await buildCompiler({ compiler, context });
    await deployCompiler({ compiler, context });
  };
}