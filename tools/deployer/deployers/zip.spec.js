import buildZip from './zip';

describe('zip', () => {
  it('should throw if zipfile list is empty', async () => {
    // Arrange
    const project = {
      config: {
        deploy: {
          zip: {
            fileList: []
          }
        }
      }
    };
    const zip = buildZip({});

    // Act
    await expect(zip(project)).rejects.toThrow('fileList must not be empty');

    // Assert
  });
  it('should add \'.\' if zipfile list not specified', async () => {
    // Arrange
    const project = {
      config: {
        deploy: {}
      },
      context: {
        buildPath: '/tmp/build'
      }
    };
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('/tmp/build/function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip(project)).resolves.toBe();

    // Assert
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('zip -q -r /tmp/build/function.zip .', { cwd: '/tmp/build' });
    expect(project).toHaveProperty('context.zipfilePath', '/tmp/build/function.zip');
  });
  it('should use \'.\' as zipfile list if fileList is not an array', async () => {
    // Arrange
    const project = {
      config: {
        deploy: {
          zip: {
            fileList: 'a'
          }
        }
      },
      context: {
        buildPath: '/tmp/build'
      }
    };
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('/tmp/build/function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip(project)).resolves.toBe();

    // Assert
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('zip -q -r /tmp/build/function.zip .', { cwd: '/tmp/build' });
    expect(project).toHaveProperty('context.zipfilePath', '/tmp/build/function.zip');
  });
  it('should add fileList to zipfile list', async () => {
    // Arrange
    const project = {
      config: {
        deploy: {
          zip: {
            fileList: ['a', 'b']
          }
        }
      },
      context: {
        buildPath: '/tmp/build'
      }
    };
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('/tmp/build/function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip(project)).resolves.toBe();

    // Assert
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith('zip -q -r /tmp/build/function.zip a b', { cwd: '/tmp/build' });
    expect(project).toHaveProperty('context.zipfilePath', '/tmp/build/function.zip');
  });
  it('should exec prezip if present', async () => {
    // Arrange
    const project = {
      config: {
        deploy: {
          zip: {
            prezip: 'my-cmd'
          }
        }
      },
      context: {
        buildPath: '/tmp/build'
      }
    };
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('/tmp/build/function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip(project)).resolves.toBe();

    // Assert
    expect(exec).toHaveBeenCalledTimes(2);
    expect(exec).toHaveBeenNthCalledWith(1, 'my-cmd', { cwd: '/tmp/build' });
    expect(exec).toHaveBeenNthCalledWith(2, 'zip -q -r /tmp/build/function.zip .', { cwd: '/tmp/build' });
    expect(project).toHaveProperty('context.zipfilePath', '/tmp/build/function.zip');
  });
});