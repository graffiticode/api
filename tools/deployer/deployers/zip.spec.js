import buildZip from './zip';

describe('zip', () => {
  it('should throw if no zip object', async () => {
    // Arrange
    const zip = buildZip({});

    // Act / Assert
    await expect(zip({ deploy: {} })).rejects.toThrow('no zip configuration');
  });
  it('should throw if no buildPath', async () => {
    // Arrange
    const zip = buildZip({});

    // Act / Assert
    await expect(zip({ deploy: { zip: {} }, context: {} })).rejects.toThrow('no buildPath');
  });
  it('should throw if zipfile list is empty', async () => {
    // Arrange
    const zip = buildZip({});

    // Act / Assert
    await expect(zip({ deploy: { zip: { fileList: [] } }, context: {} })).rejects.toThrow('zip.fileList must not be empty');
  });
  it('should add . to zipfile list if not specified', async () => {
    // Arrange
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip({ deploy: { zip: {} }, context: { buildPath: '/tmp' } })).resolves;

    // Assert
    expect(exec).toHaveBeenCalledWith('zip -q -r function.zip .', expect.anything());
  });
  it('should add . to zipfile list is not array', async () => {
    // Arrange
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip({ deploy: { zip: { fileList: 'a' } }, context: { buildPath: '/tmp' } })).resolves;

    // Assert
    expect(exec).toHaveBeenCalledWith('zip -q -r function.zip .', expect.anything());
  });
  it('should add zipfile list', async () => {
    // Arrange
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn().mockReturnValue('function.zip') };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip({ deploy: { zip: { fileList: ['a', 'b'] } }, context: { buildPath: '/tmp' } })).resolves;

    // Assert
    expect(exec).toHaveBeenCalledWith('zip -q -r function.zip a b', expect.anything());
  });
  it('should add set cwd to buildPath', async () => {
    // Arrange
    const exec = jest.fn().mockResolvedValue();
    const path = { join: jest.fn() };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip({ deploy: { zip: {} }, context: { buildPath: '/tmp' } })).resolves;

    // Assert
    expect(exec).toHaveBeenCalledWith(expect.anything(), { cwd: '/tmp' });
  });
  it('should exec prezip if present', async () => {
    // Arrange
    const exec = jest.fn()
      .mockResolvedValue('default');
    const path = { join: jest.fn().mockReturnValue() };
    const zip = buildZip({ exec, path });

    // Act
    await expect(zip({ deploy: { zip: { prezip: 'my-cmd' } }, context: { buildPath: '/tmp' } })).resolves.toBe(undefined);

    // Assert
    expect(exec).toHaveBeenNthCalledWith(1, 'my-cmd', { cwd: '/tmp' });
    expect(exec).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything());
  });
});