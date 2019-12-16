export default function buildGitInstaller({ mkdtemp, Clone, displayTextWithSpinner }) {
  return async function gitInstaller({ name, config, context }) {
    const { cancel } = displayTextWithSpinner({ text: `Install ${name} with git...` });
    try {
      context.installPath = await mkdtemp({ prefix: `graffiticode-install` });

      const { url, branch } = config.install;
      if (!url) {
        throw new Error('git install config must contain the url property');
      }

      await Clone.clone(url, context.installPath, { checkoutBranch: branch });

      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}