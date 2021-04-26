import buildBuildProject from './build';

describe('build', () => {
  it('should reject if no config', async () => {
    // Arrange
    const buildProject = buildBuildProject({});
    const project = {};

    // Act
    await expect(buildProject(project)).rejects.toThrow(`project must have a config`);

    // Assert
  });
  it('should reject if no context', async () => {
    // Arrange
    const buildProject = buildBuildProject({});
    const project = {
      config: {}
    };

    // Act
    await expect(buildProject(project)).rejects.toThrow(`project must have a context`);

    // Assert
  });
  it('should reject if no installPath in context', async () => {
    // Arrange
    const buildProject = buildBuildProject({});
    const project = {
      config: {},
      context: {}
    };

    // Act
    await expect(buildProject(project)).rejects.toThrow(`context must have an installPath`);

    // Assert
  });
  it('should call npm builder if no build config', async () => {
    // Arrange
    const project = {
      config: {},
      context: {
        installPath: '/tmp/install'
      }
    };
    const npmBuilder = jest.fn().mockImplementation(() => project.context.buildPath = '/tmp/build');
    const buildProject = buildBuildProject({ npmBuilder });

    // Act
    await expect(buildProject(project)).resolves.toBe();

    // Assert
    expect(npmBuilder).toHaveBeenCalledTimes(1);
    expect(npmBuilder).toHaveBeenCalledWith(project);
  });
  it('should call npm builder if no build type', async () => {
    // Arrange
    const project = {
      config: {
        build: {}
      },
      context: {
        installPath: '/tmp/install'
      }
    };
    const npmBuilder = jest.fn().mockImplementation(() => project.context.buildPath = '/tmp/build');
    const buildProject = buildBuildProject({ npmBuilder });

    // Act
    await expect(buildProject(project)).resolves.toBe();

    // Assert
    expect(npmBuilder).toHaveBeenCalledTimes(1);
    expect(npmBuilder).toHaveBeenCalledWith(project);
  });
  it('should call npm builder if build type is npm', async () => {
    // Arrange
    const project = {
      config: {
        build: {
          type: 'npm'
        }
      },
      context: {
        installPath: '/tmp/install'
      }
    };
    const npmBuilder = jest.fn().mockImplementation(() => project.context.buildPath = '/tmp/build');
    const buildProject = buildBuildProject({ npmBuilder });

    // Act
    await expect(buildProject(project)).resolves.toBe();

    // Assert
    expect(npmBuilder).toHaveBeenCalledTimes(1);
    expect(npmBuilder).toHaveBeenCalledWith(project);
  });
  it('should reject if unknown build type', async () => {
    // Arrange
    const project = {
      config: {
        build: {
          type: 'foo'
        }
      },
      context: {
        installPath: '/tmp/install'
      }
    };
    const buildProject = buildBuildProject({});

    // Act
    await expect(buildProject(project)).rejects.toThrow('unknown builder type: foo');

    // Assert
  });
  it('should reject if builder does not add buildPath to context', async () => {
    // Arrange
    const project = {
      config: {
        build: {
          type: 'npm'
        }
      },
      context: {
        installPath: '/tmp/install'
      }
    };
    const npmBuilder = jest.fn().mockResolvedValue();
    const buildProject = buildBuildProject({ npmBuilder });

    // Act
    await expect(buildProject(project)).rejects.toThrow('npm builder did not add buildPath to context');

    // Assert
  });
});