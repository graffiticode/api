import { tmpdir } from 'os';
import { join } from 'path';
import { fsPromise, rmdirRecursive } from './../utils';

import buildMakeConfig from './config';

describe('config', () => {
  let configDir;
  beforeEach(async () => {
    configDir = await fsPromise.mkdtemp(join(tmpdir(), 'graffiticode-api-test-'));
  });
  afterEach(async () => {
    try {
      await rmdirRecursive(configDir);
    } catch (err) {
      console.log(err.message);
      if (err.code != 'ENOTEMPTY') {
        throw err;
      }
      console.log(`Unabled to call rmdirRecursive: ${err.message}`);
      console.log(err.stack);
    }
  });
  it('should reject if no config filepath is given', async () => {
    // Arrange
    const flags = {};
    const makeConfig = buildMakeConfig({ fsPromise, flags });

    // Act
    await expect(makeConfig()).rejects.toThrow('must specify a config filepath');

    // Assert
  });
  it('should read configuration from flag', async () => {
    // Arrange
    const configFilepath = join(configDir, 'flag-config.json');
    await fsPromise.writeFile(configFilepath, JSON.stringify({ projects: { foo: {} } }));

    const flags = { config: configFilepath };
    const makeConfig = buildMakeConfig({ fsPromise, flags });

    // Act
    const config = await makeConfig();

    // Assert
    expect(config).toHaveProperty('projects.foo');
  });
});
