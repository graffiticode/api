import buildGitInstaller from './git';

describe('git', () => {
  let mkdtemp;
  let Clone;
  let cancel;
  let displayTextWithSpinner;
  let gitInstaller;
  beforeEach(() => {
    mkdtemp = jest.fn().mockResolvedValue('/tmp/123');
    Clone = {
      clone: jest.fn().mockResolvedValue()
    };
    cancel = jest.fn();
    displayTextWithSpinner = jest.fn().mockReturnValue({ cancel });
    gitInstaller = buildGitInstaller({ mkdtemp, Clone, displayTextWithSpinner });
  });
  it('should reject if install config does not contain the url property', async () => {
    // Arrange
    const project = {
      name: 'foo',
      config: {
        install: {
          type: 'git',
        }
      },
      context: {}
    };

    // Act
    await expect(gitInstaller(project)).rejects.toThrow('git install config must contain the url property');

    // Assert
    expect(displayTextWithSpinner).toHaveBeenCalledWith({ text: `Install foo with git...` });
    expect(cancel).toHaveBeenCalledWith('failed');
  });
  it('should call clone', async () => {
    // Arrange
    const project = {
      name: 'foo',
      config: {
        install: {
          type: 'git',
          url: 'https://foo.com/bar'
        }
      },
      context: {}
    };

    // Act
    await expect(gitInstaller(project)).resolves.toBe();

    // Assert
    expect(displayTextWithSpinner).toHaveBeenCalledWith({ text: `Install foo with git...` });
    expect(cancel).toHaveBeenCalledWith('done');
    expect(Clone.clone).toHaveBeenCalledWith('https://foo.com/bar', '/tmp/123', {});
    expect(project).toHaveProperty('context.installPath', '/tmp/123');
  });
  it('should reject if install config does not contain the url property', async () => {
    // Arrange
    const project = {
      name: 'foo',
      config: {
        install: {
          type: 'git'
        }
      },
      context: {}
    };

    // Act
    await expect(gitInstaller(project)).rejects.toThrow('git install config must contain the url property');

    // Assert
    expect(displayTextWithSpinner).toHaveBeenCalledWith({ text: `Install foo with git...` });
    expect(cancel).toHaveBeenCalledWith('failed');
  });
  it('should reject if Clone.clone throws', async () => {
    // Arrange
    Clone.clone = jest.fn().mockRejectedValue(new Error('foo'));
    const project = {
      name: 'foo',
      config: {
        install: {
          type: 'git',
          url: 'https://foo.com/bar'
        }
      },
      context: {}
    };

    // Act
    await expect(gitInstaller(project)).rejects.toThrow('foo');

    // Assert
    expect(displayTextWithSpinner).toHaveBeenCalledWith({ text: `Install foo with git...` });
    expect(cancel).toHaveBeenCalledWith('failed');
  });
});