export default function buildLocalGetter({ path, displayTextWithSpinner }) {
  return async function localGetter({ repository, context }) {
    const { cancel } = displayTextWithSpinner({ text: `Install compiler from local...` });
    try {
      let getPath = repository.path;
      if (!path.isAbsolute(getPath)) {
        getPath = path.resolve(process.cwd(), getPath);
      }
      context.getPath = getPath;

      cancel('done');
    } catch (err) {
      cancel('failed');
      throw err;
    }
  };
}