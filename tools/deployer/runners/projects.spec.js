import buildRunProjects from './projects';

describe('projects', () => {
  it('should call runProject', async () => {
    // Arrange
    const runProject = jest.fn().mockResolvedValue();
    const runProjects = buildRunProjects({ runProject });
    const config = {
      projects: {
        foo: {}
      }
    };

    // Act 
    await expect(runProjects({ config })).resolves.toBe();

    // Assert
    expect(runProject).toHaveBeenCalledTimes(1);
    expect(runProject).toHaveBeenCalledWith({ name: 'foo', config: {}, context: { config } });
  });
  it('should call runProject with multiple projects', async () => {
    // Arrange
    const runProject = jest.fn().mockResolvedValue();
    const runProjects = buildRunProjects({ runProject });
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
    expect(runProject).toHaveBeenNthCalledWith(1, { name: 'foo', config: { value: 42 }, context: { config } });
    expect(runProject).toHaveBeenNthCalledWith(2, { name: 'bar', config: { value: 31 }, context: { config } });
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
});