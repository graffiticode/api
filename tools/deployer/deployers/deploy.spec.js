import buildDeployProject from './deploy';

describe('deploy', () => {
  it('should reject if no config', async () => {
    // Arrange
    const project = {};
    const deployProject = buildDeployProject({});

    // Act
    await expect(deployProject(project)).rejects.toThrow(`project must have a config`);

    // Assert
  });
  it('should reject if no context', async () => {
    // Arrange
    const project = {
      config: {}
    };
    const deployProject = buildDeployProject({});

    // Act
    await expect(deployProject(project)).rejects.toThrow(`project must have a context`);

    // Assert
  });
  it('should reject if no installPath in context', async () => {
    // Arrange
    const project = {
      config: {},
      context: {}
    };
    const deployProject = buildDeployProject({});

    // Act
    await expect(deployProject(project)).rejects.toThrow(`context must have an installPath`);

    // Assert
  });
  it('should reject if no buildPath in context', async () => {
    // Arrange
    const project = {
      config: {},
      context: {
        installPath: '/tmp/install'
      }
    };
    const deployProject = buildDeployProject({});

    // Act
    await expect(deployProject(project)).rejects.toThrow(`context must have an buildPath`);

    // Assert
  });
  it('should reject if unknown deploy type', async () => {
    // Arrange
    const project = {
      config: {
        deploy: {
          type: 'foo'
        }
      },
      context: {
        installPath: '/tmp/install',
        buildPath: '/tmp/build'
      }
    };
    const deployProject = buildDeployProject({});

    // Act
    await expect(deployProject(project)).rejects.toThrow(`unknown deploy type: foo`);

    // Assert
  });
  it('should lambdaDeployer if no deploy config', async () => {
    // Arrange
    const project = {
      config: {},
      context: {
        installPath: '/tmp/install',
        buildPath: '/tmp/build'
      }
    };
    const lambdaDeployer = jest.fn().mockResolvedValue();
    const deployProject = buildDeployProject({ lambdaDeployer });

    // Act
    await expect(deployProject(project)).resolves.toBe();

    // Assert
    expect(lambdaDeployer).toHaveBeenCalledTimes(1);
    expect(lambdaDeployer).toHaveBeenCalledWith(project);
  });
});