export default function buildZip({ exec, path }) {
  return async function zip({ deploy, context }) {
    const { zip } = deploy;
    if (!zip) {
      throw new Error('no zip configuration');
    }

    let { fileList, prezip } = zip;
    if (!Array.isArray(fileList)) {
      fileList = ['.'];
    }
    if (fileList.length <= 0) {
      throw new Error('zip.fileList must not be empty');
    }

    if (!context.buildPath) {
      throw new Error('no buildPath');
    }
    const zipfilePath = path.join(context.buildPath, 'function.zip');
    const options = { cwd: context.buildPath };

    if (prezip) {
      await exec(prezip, options);
    }

    let command = `zip -q -r ${zipfilePath}`;
    fileList.forEach((zipfile) => {
      command += ` ${zipfile}`;
    });

    await exec(command, options);

    context.zipfilePath = zipfilePath;
    return zipfilePath;
  };
}