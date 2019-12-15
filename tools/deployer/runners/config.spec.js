import { promises as fs } from 'fs';
import { join } from 'path';
import { mkdtemp } from './../utils';

import buildMakeConfig from './config';

describe('config', () => {
  let configDir;
  beforeEach(async () => {
    configDir = await mkdtemp({ prefix: 'graffiticode-api-test' });
  });
  afterEach(async () => {
    try {
      await fs.rmdir(configDir, { recursive: true });
    } catch (err) {
      if (err.code != 'ENOTEMPTY') {
        throw err;
      }
      console.log(`Unabled to call fs.rmdir: ${err.message}`);
    }
  });
  it('should reject if no config filepath is given', async () => {
    // Arrange
    const flags = {};
    const makeConfig = buildMakeConfig({ fs, flags });

    // Act
    await expect(makeConfig()).rejects.toThrow('must specify a config filepath');

    // Assert
  });
  it('should read configuration from flag', async () => {
    // Arrange
    const configFilepath = join(configDir, 'flag-config.json');
    await fs.writeFile(configFilepath, JSON.stringify({ projects: { foo: {} } }))

    const flags = { config: configFilepath };
    const makeConfig = buildMakeConfig({ fs, flags });

    // Act
    const config = await makeConfig();

    // Assert
    expect(config).toHaveProperty('projects.foo');
  });
});