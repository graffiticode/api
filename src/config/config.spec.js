import buildGetConfig from './config';

describe('config', () => {
  it('return the global', () => {
    // Arrange
    const global = { config: 'config' };
    const getConfig = buildGetConfig({ global });

    // Act
    const config = getConfig();

    // Assert
    expect(config).toEqual(global.config);
  });
});