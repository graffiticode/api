export default function buildZip({ exec, path }) {
  return async function zip({ config, context }) {
    const { zip = {} } = config.deploy;

    let { fileList, prezip } = zip;
    if (!Array.isArray(fileList)) {
      fileList = ['.'];
    }
    if (fileList.length <= 0) {
      throw new Error('fileList must not be empty');
    }

    const options = { cwd: context.buildPath };

    if (prezip) {
      await exec(prezip, options);
    }

    const zipfilePath = path.join(context.buildPath, 'function.zip');
    const command = fileList.reduce((command, zipfile) => command + ` ${zipfile}`, `zip -q -r ${zipfilePath}`);
    await exec(command, options);

    context.zipfilePath = zipfilePath;
  };
}