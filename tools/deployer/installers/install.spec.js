import buildInstallProject from './install';

describe('install', () => {
  it('should reject if no config', async () => {
    // Arrange
    const installProject = buildInstallProject({});
    const project = {};

    // Act
    await expect(installProject(project)).rejects.toThrow(`project must have a config`);

    // Assert
  });
  it('should reject if no install config', async () => {
    // Arrange
    const installProject = buildInstallProject({});
    const project = {
      config: {}
    };

    // Act
    await expect(installProject(project)).rejects.toThrow(`project config must contain an install property`);

    // Assert
  });
  it('should reject if no context', async () => {
    // Arrange
    const installProject = buildInstallProject({});
    const project = {
      config: {
        install: {}
      }
    };

    // Act
    await expect(installProject(project)).rejects.toThrow(`project must have a context`);

    // Assert
  });
  it('should call gitInstaller if no install type', async () => {
    // Arrange
    const project = {
      config: {
        install: {}
      },
      context: {}
    };
    const gitInstaller = jest.fn().mockImplementation(() => project.context.installPath = '/tmp');
    const installProject = buildInstallProject({ gitInstaller });

    // Act
    await expect(installProject(project)).resolves.toBe();

    // Assert
    expect(gitInstaller).toHaveBeenCalledTimes(1);
    expect(gitInstaller).toHaveBeenCalledWith(project);
  });
  it('should call gitInstaller if install type is git', async () => {
    // Arrange
    const project = {
      config: {
        install: {
          type: 'git'
        }
      },
      context: {}
    };
    const gitInstaller = jest.fn().mockImplementation(() => project.context.installPath = '/tmp');
    const installProject = buildInstallProject({ gitInstaller });

    // Act
    await expect(installProject(project)).resolves.toBe();

    // Assert
    expect(gitInstaller).toHaveBeenCalledTimes(1);
    expect(gitInstaller).toHaveBeenCalledWith(project);
  });
  it('should call localInstaller if install type is git', async () => {
    // Arrange
    const project = {
      config: {
        install: {
          type: 'local'
        }
      },
      context: {}
    };
    const localInstaller = jest.fn().mockImplementation(() => project.context.installPath = '/tmp');
    const installProject = buildInstallProject({ localInstaller });

    // Act
    await expect(installProject(project)).resolves.toBe();

    // Assert
    expect(localInstaller).toHaveBeenCalledTimes(1);
    expect(localInstaller).toHaveBeenCalledWith(project);
  });
  it('should reject if unknown install type', async () => {
    // Arrange
    const installProject = buildInstallProject({});
    const project = {
      config: {
        install: {
          type: 'foo'
        }
      },
      context: {}
    };

    // Act
    await expect(installProject(project)).rejects.toThrow(`unknown install type: foo`);

    // Assert
  });
  it('should reject if installer does not add installPath to context', async () => {
    // Arrange
    const gitInstaller = jest.fn().mockResolvedValue('foo');
    const installProject = buildInstallProject({ gitInstaller });
    const project = {
      config: {
        install: {
          type: 'git'
        }
      },
      context: {}
    };

    // Act
    await expect(installProject(project)).rejects.toThrow(`git installer did not add installPath to context`);

    // Assert
  });
});