import { isAbsolute, resolve } from 'path';
import buildLocalInstaller from './local';

describe('local', () => {
  it('should set the install path to the local path', async () => {
    // Arrange
    const cancel = jest.fn();
    const displayTextWithSpinner = jest.fn().mockReturnValue({ cancel });
    const localInstaller = buildLocalInstaller({ isAbsolute, resolve, displayTextWithSpinner });
    const project = {
      config: {
        install: {
          type: 'local',
          path: '/foo'
        }
      },
      context: {}
    };

    // Act
    await expect(localInstaller(project)).resolves.toBe();

    // Assert
    expect(project).toHaveProperty('context.installPath', '/foo');
    expect(displayTextWithSpinner).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith('done');
  });
  it('should change local path to absolute path', async () => {
    // Arrange
    const process = {
      cwd: jest.fn().mockReturnValue('/bar')
    };
    const cancel = jest.fn();
    const displayTextWithSpinner = jest.fn().mockReturnValue({ cancel });
    const localInstaller = buildLocalInstaller({ isAbsolute, resolve, process, displayTextWithSpinner });
    const project = {
      config: {
        install: {
          type: 'local',
          path: 'foo'
        }
      },
      context: {}
    };

    // Act
    await expect(localInstaller(project)).resolves.toBe();

    // Assert
    expect(project).toHaveProperty('context.installPath', resolve('/bar', 'foo'));
    expect(displayTextWithSpinner).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith('done');
  });
  it('should reject if install config does not contain the path property', async () => {
    // Arrange
    const process = {
      cwd: jest.fn().mockReturnValue('/bar')
    };
    const cancel = jest.fn();
    const displayTextWithSpinner = jest.fn().mockReturnValue({ cancel });
    const localInstaller = buildLocalInstaller({ isAbsolute, resolve, process, displayTextWithSpinner });
    const project = {
      config: {
        install: {
          type: 'local',
        }
      },
      context: {}
    };

    // Act
    await expect(localInstaller(project)).rejects.toThrow('local install config must contain the path property');

    // Assert
    expect(displayTextWithSpinner).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith('failed');
  });
});