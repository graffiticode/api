export default function buildGitGetter({ mkdtemp, Clone, displayTextWithSpinner }) {
  return async function gitCompiler({ repository, context }) {
    const { cancel } = displayTextWithSpinner({ text: `Install compiler with git...` });
    try {
      const localPath = await mkdtemp({ prefix: `graffiticode-get` });
      context.getPath = localPath;

      const { url, branch } = repository;
      await Clone.clone(url, localPath, { checkoutBranch: branch });

      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}