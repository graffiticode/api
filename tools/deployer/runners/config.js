export default function buildMakeConfig({ flags, fsPromise }) {
  return async function makeConfig({ }) {
    if (flags.config) {
      return JSON.parse(await fsPromise.readFile(flags.config));
    }
    throw new Error('must specify a config filepath');
  };
}