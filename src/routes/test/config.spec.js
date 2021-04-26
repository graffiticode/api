import buildConfigHandler from '../config.js';

describe('routes', () => {
  describe('config', () => {
    it('returns the global config', () => {
      // Arrange
      const getConfig = jest.fn().mockReturnValue('config');
      const configHandler = buildConfigHandler({ getConfig });
      const req = {};
      const res = {
        status: jest.fn().mockImplementation(() => res),
        json: jest.fn().mockImplementation(() => res)
      };

      // Act
      expect(configHandler(req, res)).toBe();

      // Assert
      expect(getConfig).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith('config');
    });
  });
});
