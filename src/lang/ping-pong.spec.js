import { buildPingPong } from './ping-pong';

describe('pingPong', () => {
  it('should return true when language pongs', async () => {
    // Arrange
    const baseUrl = 'http://ltest.artcompiler.com';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const call = jest.fn().mockResolvedValue();
    const bent = jest.fn().mockReturnValue(call);
    const pingPong = buildPingPong({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';

    // Act
    const pong = await pingPong(lang);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'HEAD');
    expect(call).toHaveBeenCalledWith('/');
    expect(pong).toBe(true);
  });

  it('should return false call throws', async () => {
    // Arrange
    const baseUrl = 'http://ltest.artcompiler.com';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const call = jest.fn().mockRejectedValue(new Error('failed to ping'));
    const bent = jest.fn().mockReturnValue(call);
    const pingPong = buildPingPong({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';

    // Act
    const pong = await pingPong(lang);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'HEAD');
    expect(call).toHaveBeenCalledWith('/');
    expect(pong).toBe(false);
  });

  it('should cache successful ping call', async () => {
    // Arrange
    const baseUrl = 'http://ltest.artcompiler.com';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const call = jest.fn().mockResolvedValue();
    const bent = jest.fn().mockReturnValue(call);
    const pingPong = buildPingPong({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';

    // Act
    const pong1 = await pingPong(lang);
    const pong2 = await pingPong(lang);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledTimes(1);
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledTimes(1);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'HEAD');
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith('/');
    expect(pong1).toBe(true);
    expect(pong2).toBe(true);
  });

  it('should not cache failed ping call', async () => {
    // Arrange
    const baseUrl = 'http://ltest.artcompiler.com';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const call = jest.fn()
      .mockRejectedValueOnce(new Error('failed to ping'))
      .mockResolvedValue();
    const bent = jest.fn().mockReturnValue(call);
    const pingPong = buildPingPong({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';

    // Act
    const pong1 = await pingPong(lang);
    const pong2 = await pingPong(lang);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledTimes(2);
    expect(getBaseUrlForLanguage).toHaveBeenNthCalledWith(1, lang);
    expect(getBaseUrlForLanguage).toHaveBeenNthCalledWith(2, lang);
    expect(bent).toHaveBeenCalledTimes(2);
    expect(bent).toHaveBeenNthCalledWith(1, baseUrl, 'HEAD');
    expect(bent).toHaveBeenNthCalledWith(2, baseUrl, 'HEAD');
    expect(bent).toHaveBeenCalledTimes(2);
    expect(call).toHaveBeenNthCalledWith(1, '/');
    expect(call).toHaveBeenNthCalledWith(2, '/');
    expect(pong1).toBe(false);
    expect(pong2).toBe(true);
  });
});