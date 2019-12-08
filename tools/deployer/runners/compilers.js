export default function buildHandlerCompilers({ handleCompiler }) {
  return async function handleCompilers({ compilers, config }) {
    const context = {
      config,
      compilers: {},
      handles: [],
    };
    await compilers.reduce(async (prev, compiler) => {
      if (context.config.sync) {
        await prev;
      }
      context.compilers[compiler.name] = { config: context.config };
      try {
        const curr = handleCompiler({ compiler, context: context.compilers[compiler.name] });
        context.handles.push(curr);
        if (context.config.sync) {
          await curr;
        }
      } catch (err) {
        console.log(err);
        console.log(`Failed to handle compiler ${compiler.name}: ${err.message}`);
        console.log();
      }
    }, Promise.resolve());
  };
}