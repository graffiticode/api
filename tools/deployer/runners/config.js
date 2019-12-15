export default function buildMakeConfig({ fs, flags }) {
  return async function makeConfig({ }) {
    if (flags.config) {
      return JSON.parse(await fs.readFile(flags.config));
    }
    throw new Error('must specify a config filepath');
  };
}