export default function buildLocalInstaller({ resolve, isAbsolute, process, displayTextWithSpinner }) {
  return async function localInstaller({ name, config, context }) {
    const { cancel } = displayTextWithSpinner({ text: `Install ${name} from local...` });
    try {
      let installPath = config.install.path;
      if (!installPath) {
        throw new Error('local install config must contain the path property');
      }
      if (!isAbsolute(installPath)) {
        installPath = resolve(process.cwd(), installPath);
      }
      context.installPath = installPath;

      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}