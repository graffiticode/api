import { buildRunProject } from './project';

describe('project', () => {
  it('should call install, build, and deploy project', async () => {
    // Arrange
    const log = jest.fn();
    const installProject = jest.fn().mockResolvedValue();
    const buildProject = jest.fn().mockResolvedValue();
    const deployProject = jest.fn().mockResolvedValue();
    const runProject = buildRunProject({ log, installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).resolves.toStrictEqual({ err: false });

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
    expect(buildProject).toHaveBeenCalledWith(project);
    expect(deployProject).toHaveBeenCalledWith(project);
    expect(project).toHaveProperty('context.installPromise');
    expect(project).toHaveProperty('context.buildPromise');
    expect(project).toHaveProperty('context.deployPromise');
  });
  it('should return err true if installProject rejects', async () => {
    // Arrange
    const log = jest.fn();
    const installProject = jest.fn().mockRejectedValue(new Error('foo'));
    const buildProject = jest.fn().mockResolvedValue();
    const deployProject = jest.fn().mockResolvedValue();
    const runProject = buildRunProject({ log, installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).resolves.toStrictEqual({ err: true });

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
    expect(buildProject).toHaveBeenCalledTimes(0);
    expect(deployProject).toHaveBeenCalledTimes(0);
  });
  it('should return err true if buildProject rejects', async () => {
    // Arrange
    const log = jest.fn();
    const installProject = jest.fn().mockResolvedValue();
    const buildProject = jest.fn().mockRejectedValue(new Error('foo'));
    const deployProject = jest.fn().mockResolvedValue();
    const runProject = buildRunProject({ log, installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).resolves.toStrictEqual({ err: true });

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
    expect(buildProject).toHaveBeenCalledWith(project);
    expect(deployProject).toHaveBeenCalledTimes(0);
  });
  it('should return err true if deployProject rejects', async () => {
    // Arrange
    const log = jest.fn();
    const installProject = jest.fn().mockResolvedValue();
    const buildProject = jest.fn().mockResolvedValue();
    const deployProject = jest.fn().mockRejectedValue(new Error('foo'));
    const runProject = buildRunProject({ log, installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).resolves.toStrictEqual({ err: true });

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
    expect(buildProject).toHaveBeenCalledWith(project);
    expect(deployProject).toHaveBeenCalledWith(project);
  });
});