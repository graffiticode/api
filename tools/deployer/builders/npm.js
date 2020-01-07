export default function buildNpmBuilder({ stat, copyFile, join, tmpdir, exec, mkdtemp, displayTextWithSpinner }) {
  return async function npmBuilder({ name, config, context }) {
    const { cancel, updateText } = displayTextWithSpinner({ text: `Build ${name} with npm[init]...` });
    try {
      const { build = {} } = config;
      const { scripts = {} } = build;

      updateText(`Build ${name} with npm[install]...`);
      await exec(`npm ci --prefix ${context.installPath}`);

      updateText(`Build ${name} with npm[build]...`);
      const buildScript = scripts.build || 'build';
      await exec(`npm run --prefix ${context.installPath} ${buildScript}`);

      updateText(`Build ${name} with npm[install production]...`);
      context.buildPath = await mkdtemp(join(tmpdir(), `graffiticode-build-`));
      await copyFile(join(context.installPath, 'package.json'), join(context.buildPath, 'package.json'));
      await copyFile(join(context.installPath, 'package-lock.json'), join(context.buildPath, 'package-lock.json'));
      await exec(`npm ci --prefix ${context.buildPath} --production --ignore-scripts`);

      updateText(`Build ${name} with npm[copy build files]...`);
      let { fileList } = build;
      if (!Array.isArray(fileList)) {
        fileList = ['build'];
      }

      await Promise.all(fileList.map(async (filepath) => {
        try {
          const filestat = await stat(join(context.installPath, filepath));
          if (filestat.isDirectory()) {
            await exec(`cp -r ${join(context.installPath, filepath)} ${join(context.buildPath, filepath)}`);
          } else if (filestat.isFile()) {
            await copyFile(join(context.installPath, filepath), join(context.buildPath, filepath));
          }
        } catch (err) {
          console.log(`Failed to move file ${join(context.installPath, filepath)}: ${err.message}`, err);
        }
      }));

      updateText(`Build ${name} with npm...`);
      cancel('done');
    } catch (err) {
      console.log(err);
      cancel('failed');
      throw err;
    }
  };
}
