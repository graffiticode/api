export default function buildNpmBuilder({ fs, path, exec, mkdtemp, displayTextWithSpinner }) {
  return async function npmBuilder({ build, context }) {
    const { cancel, updateText } = displayTextWithSpinner({ text: 'Build compiler with npm[init]...' });
    try {
      const { scripts = {} } = build;

      updateText(`Build compiler with npm[install]...`);
      await exec(`npm ci --prefix ${context.getPath}`);

      updateText(`Build compiler with npm[build]...`);
      const buildScript = scripts.build || 'build';
      await exec(`npm run --prefix ${context.getPath} ${buildScript}`);

      updateText(`Build compiler with npm[install production]...`);
      context.buildPath = await mkdtemp({ prefix: 'graffiticode-build' });
      await fs.copyFile(path.join(context.getPath, 'package.json'), path.join(context.buildPath, 'package.json'));
      await fs.copyFile(path.join(context.getPath, 'package-lock.json'), path.join(context.buildPath, 'package-lock.json'));
      await exec(`npm ci --prefix ${context.buildPath} --production --ignore-scripts`);

      updateText(`Build compiler with npm[copy build files]...`);
      let { fileList } = build;
      if (!Array.isArray(fileList)) {
        fileList = ['build'];
      }

      await Promise.all(fileList.map(async (filepath) => {
        try {
          const stat = await fs.stat(path.join(context.getPath, filepath));
          if (stat.isDirectory()) {
            await exec(`cp -r ${path.join(context.getPath, filepath)} ${path.join(context.buildPath, filepath)}`);
          } else if (stat.isFile()) {
            await fs.copyFile(path.join(context.getPath, filepath), path.join(context.buildPath, filepath));
          }
        } catch (err) {
          console.log(`Failed to move file ${path.join(context.getPath, filepath)}: ${err.message}`, err);
        }
      }));

      updateText(`Build compiler with npm...`);
      cancel('done');
    } catch (err) {
      console.log(err);
      cancel('failed');
      throw err;
    }
  };
}