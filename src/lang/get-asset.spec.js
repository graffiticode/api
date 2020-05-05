import { buildGetAsset } from './get-asset';

describe('getAsset', () => {
  it('should returned fetched asset', async () => {
    // Arrange
    const baseUrl = 'http://localhost:5000';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const asset = 'asset';
    const call = jest.fn().mockResolvedValue(asset);
    const bent = jest.fn().mockReturnValue(call);
    const getAsset = buildGetAsset({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';
    const path = '/path';

    // Act
    const actual = await getAsset(lang, path);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'string');
    expect(call).toHaveBeenCalledWith(path);
    expect(actual).toBe(asset);
  });

  it('should throw error is fails to get asset', async () => {
    // Arrange
    const baseUrl = 'http://localhost:5000';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const call = jest.fn().mockRejectedValue(new Error('failed to get asset'));
    const bent = jest.fn().mockReturnValue(call);
    const getAsset = buildGetAsset({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';
    const path = '/path';

    // Act
    await expect(getAsset(lang, path)).rejects.toThrow('failed to get asset');

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'string');
    expect(call).toHaveBeenCalledWith(path);
  });

  it('should cache fetched assets', async () => {
    // Arrange
    const baseUrl = 'http://localhost:5000';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const asset = 'asset';
    const call = jest.fn().mockResolvedValue(asset);
    const bent = jest.fn().mockReturnValue(call);
    const getAsset = buildGetAsset({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';
    const path = '/path';

    // Act
    const asset1 = await getAsset(lang, path);
    const asset2 = await getAsset(lang, path);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledTimes(1);
    expect(getBaseUrlForLanguage).toHaveBeenCalledWith(lang);
    expect(bent).toHaveBeenCalledTimes(1);
    expect(bent).toHaveBeenCalledWith(baseUrl, 'string');
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith(path);
    expect(asset1).toBe(asset);
    expect(asset2).toBe(asset);
  });

  it('should not cache failed asset', async () => {
    // Arrange
    const baseUrl = 'http://localhost:5000';
    const getBaseUrlForLanguage = jest.fn().mockReturnValue(baseUrl);
    const asset = 'asset';
    const call = jest.fn()
      .mockRejectedValueOnce(new Error('failed to get asset'))
      .mockResolvedValue(asset);
    const bent = jest.fn().mockReturnValue(call);
    const getAsset = buildGetAsset({ getBaseUrlForLanguage, bent });
    const lang = 'LTest';
    const path = '/path';

    // Act
    await expect(getAsset(lang, path)).rejects.toThrow('failed to get asset');
    const asset2 = await getAsset(lang, path);

    // Assert
    expect(getBaseUrlForLanguage).toHaveBeenCalledTimes(2);
    expect(getBaseUrlForLanguage).toHaveBeenNthCalledWith(1, lang);
    expect(getBaseUrlForLanguage).toHaveBeenNthCalledWith(2, lang);
    expect(bent).toHaveBeenCalledTimes(2);
    expect(bent).toHaveBeenNthCalledWith(1, baseUrl, 'string');
    expect(bent).toHaveBeenNthCalledWith(2, baseUrl, 'string');
    expect(call).toHaveBeenCalledTimes(2);
    expect(call).toHaveBeenNthCalledWith(1, path);
    expect(call).toHaveBeenNthCalledWith(2, path);
    expect(asset2).toBe(asset);
  });
});