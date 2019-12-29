import { buildRunProject } from './project';

describe('project', () => {
  it('should call install, build, and deploy project', async () => {
    // Arrange
    const installProject = jest.fn().mockResolvedValue();
    const buildProject = jest.fn().mockResolvedValue();
    const deployProject = jest.fn().mockResolvedValue();
    const runProject = buildRunProject({ installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).resolves.toBe();

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
    expect(buildProject).toHaveBeenCalledWith(project);
    expect(deployProject).toHaveBeenCalledWith(project);
  });
  it('should reject if installProject rejects', async () => {
    // Arrange
    const installProject = jest.fn().mockRejectedValue(new Error('foo'));
    const buildProject = jest.fn().mockResolvedValue();
    const deployProject = jest.fn().mockResolvedValue();
    const runProject = buildRunProject({ installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).rejects.toThrow('foo');

    // Assert
  });
  it('should reject if buildProject rejects', async () => {
    // Arrange
    const installProject = jest.fn().mockResolvedValue();
    const buildProject = jest.fn().mockRejectedValue(new Error('foo'));
    const deployProject = jest.fn().mockResolvedValue();
    const runProject = buildRunProject({ installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).rejects.toThrow('foo');

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
  });
  it('should reject if deployProject rejects', async () => {
    // Arrange
    const installProject = jest.fn().mockResolvedValue();
    const buildProject = jest.fn().mockResolvedValue();
    const deployProject = jest.fn().mockRejectedValue(new Error('foo'));
    const runProject = buildRunProject({ installProject, buildProject, deployProject });
    const project = { name: 'foo', config: { value: 42 }, context: {} };

    // Act
    await expect(runProject(project)).rejects.toThrow('foo');

    // Assert
    expect(installProject).toHaveBeenCalledWith(project);
    expect(buildProject).toHaveBeenCalledWith(project);
  });
});