import buildRunProjects from './projects';

describe('projects', () => {
  it('should call runProject', async () => {
    // Arrange
    const runProject = jest.fn().mockResolvedValue();
    const postRunProject = jest.fn().mockResolvedValue();
    const runProjects = buildRunProjects({ runProject, postRunProject });
    const config = {
      projects: {
        foo: {}
      }
    };

    // Act 
    await expect(runProjects({ config })).resolves.toBe();

    // Assert
    expect(runProject).toHaveBeenCalledTimes(1);
    expect(runProject).toHaveBeenCalledWith({ name: 'foo', config: {}, context: { config, callbacks: [] } });
    expect(postRunProject).toHaveBeenCalledTimes(0);
  });
  it('should call runProject with multiple projects', async () => {
    // Arrange
    const runProject = jest.fn().mockResolvedValue();
    const postRunProject = jest.fn().mockResolvedValue();
    const runProjects = buildRunProjects({ runProject, postRunProject });
    const config = {
      projects: {
        foo: { value: 42 },
        bar: { value: 31 }
      }
    };

    // Act 
    await expect(runProjects({ config })).resolves.toBe();

    // Assert
    expect(runProject).toHaveBeenCalledTimes(2);
    expect(runProject).toHaveBeenNthCalledWith(1, { name: 'foo', config: { value: 42 }, context: { config, callbacks: [] } });
    expect(runProject).toHaveBeenNthCalledWith(2, { name: 'bar', config: { value: 31 }, context: { config, callbacks: [] } });
    expect(postRunProject).toHaveBeenCalledTimes(0);
  });
  it('should reject if runProject rejects', async () => {
    // Arrange
    const runProject = jest.fn().mockRejectedValue(new Error('foo'));
    const runProjects = buildRunProjects({ runProject });
    const config = {
      projects: {
        foo: {}
      }
    };

    // Act 
    await expect(runProjects({ config })).rejects.toThrow('foo');

    // Assert
  });
  it('should call postRunProject when configured', async () => {
    // Arrange
    const runProject = jest.fn().mockResolvedValue();
    const postRunProject = jest.fn().mockResolvedValue();
    const runProjects = buildRunProjects({ runProject, postRunProject });
    const config = {
      projects: {
        foo: {
          postRun: true
        }
      }
    };

    // Act
    await expect(runProjects({ config })).resolves.toBe();

    // Assert
    expect(runProject).toHaveBeenCalledTimes(1);
    expect(runProject).toHaveBeenCalledWith({ name: 'foo', config: { postRun: true }, context: { config, callbacks: [] } });
    expect(postRunProject).toHaveBeenCalledTimes(1);
    expect(postRunProject).toHaveBeenCalledWith([{ name: 'foo', config: { postRun: true }, context: { config, callbacks: [] } }]);
  });
  it('should call postRun callback', async () => {
    // Arrange
    const callback = jest.fn().mockResolvedValue();
    const runProject = jest.fn().mockImplementation(({ context }) => {
      context.callbacks.push(callback);
      return Promise.resolve();
    });
    const postRunProject = jest.fn().mockResolvedValue();
    const runProjects = buildRunProjects({ runProject, postRunProject });
    const config = {
      projects: {
        foo: {}
      }
    };

    // Act
    await expect(runProjects({ config })).resolves.toBe();

    // Assert
    expect(runProject).toHaveBeenCalledTimes(1);
    expect(runProject).toHaveBeenCalledWith({ name: 'foo', config: {}, context: { config, callbacks: [ callback ] } });
    expect(postRunProject).toHaveBeenCalledTimes(0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith([{ name: 'foo', config: { }, context: { config, callbacks: [ callback ] } }]);
  });
});