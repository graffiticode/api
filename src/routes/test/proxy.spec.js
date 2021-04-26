import buildProxyHandler from '../proxy.js';

describe('routes', () => {
  describe('proxy', () => {
    it('calls next', async () => {
      // Arrange
      const httpAgent = 'httpAgent';
      const httpsAgent = 'httpsAgent';
      const config = {
        proxy: {
          targets: []
        }
      };
      const getConfig = jest.fn().mockReturnValue(config);
      const targetRes = {
        text: jest.fn().mockResolvedValue('body'),
        json: jest.fn()
      };
      const fetch = jest.fn().mockResolvedValue(targetRes);
      const uuid = { v4: jest.fn().mockReturnValue('requestId') };
      const log = jest.fn();
      const proxyHandler = buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid });
      const req = {
        get: jest.fn(),
        method: 'GET',
        url: '/a/b?c=d'
      };
      const res = {};
      const next = jest.fn();

      // Act
      await expect(proxyHandler(req, res, next)).resolves.toBe();

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
    });
    it('calls fetch for config target', async () => {
      // Arrange
      const httpAgent = 'httpAgent';
      const httpsAgent = 'httpsAgent';
      const config = {
        proxy: {
          targets: [
            'https://foo.bar.com',
          ]
        }
      };
      const getConfig = jest.fn().mockReturnValue(config);
      const targetRes = {
        text: jest.fn().mockResolvedValue('body'),
        json: jest.fn()
      };
      const fetch = jest.fn().mockResolvedValue(targetRes);
      const uuid = { v4: jest.fn().mockReturnValue('requestId') };
      const log = jest.fn();
      const proxyHandler = buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid });
      const req = {
        get: jest.fn(),
        method: 'GET',
        url: '/a/b?c=d',
        headers: {},
        body: 'body'
      };
      const res = {};
      const next = jest.fn();

      // Act
      await expect(proxyHandler(req, res, next)).resolves.toBe();

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://foo.bar.com/a/b?c=d', {
        method: 'GET',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: null,
        agent: httpsAgent
      });
    });
    it('calls fetch for config targets', async () => {
      // Arrange
      const httpAgent = 'httpAgent';
      const httpsAgent = 'httpsAgent';
      const config = {
        proxy: {
          targets: [
            'https://foo.bar.com',
            'https://boo.bar.com',
          ]
        }
      };
      const getConfig = jest.fn().mockReturnValue(config);
      const targetRes = {
        text: jest.fn().mockResolvedValue('body'),
        json: jest.fn()
      };
      const fetch = jest.fn().mockResolvedValue(targetRes);
      const uuid = { v4: jest.fn().mockReturnValue('requestId') };
      const log = jest.fn();
      const proxyHandler = buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid });
      const req = {
        get: jest.fn(),
        method: 'GET',
        url: '/a/b?c=d',
        headers: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      await expect(proxyHandler(req, res, next)).resolves.toBe();

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenNthCalledWith(1, 'https://foo.bar.com/a/b?c=d', {
        method: 'GET',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: null,
        agent: httpsAgent
      });
      expect(fetch).toHaveBeenNthCalledWith(2, 'https://boo.bar.com/a/b?c=d', {
        method: 'GET',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: null,
        agent: httpsAgent
      });
    });
    it('calls adds body for POST', async () => {
      // Arrange
      const httpAgent = 'httpAgent';
      const httpsAgent = 'httpsAgent';
      const config = {
        proxy: {
          targets: [
            'https://foo.bar.com',
          ]
        }
      };
      const getConfig = jest.fn().mockReturnValue(config);
      const targetRes = {
        text: jest.fn().mockResolvedValue('body'),
        json: jest.fn()
      };
      const fetch = jest.fn().mockResolvedValue(targetRes);
      const uuid = { v4: jest.fn().mockReturnValue('requestId') };
      const log = jest.fn();
      const proxyHandler = buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid });
      const req = {
        get: jest.fn(),
        method: 'POST',
        url: '/L0/compile',
        headers: {},
        body: 'body'
      };
      const res = {};
      const next = jest.fn();

      // Act
      await expect(proxyHandler(req, res, next)).resolves.toBe();

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://foo.bar.com/L0/compile', {
        method: 'POST',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: 'body',
        agent: httpsAgent
      });
    });
    it('does not throw if fetch throws', async () => {
      // Arrange
      const httpAgent = 'httpAgent';
      const httpsAgent = 'httpsAgent';
      const config = {
        proxy: {
          targets: [
            'https://foo.bar.com',
          ]
        }
      };
      const getConfig = jest.fn().mockReturnValue(config);
      const fetch = jest.fn().mockRejectedValue(new Error('fetch error'));
      const uuid = { v4: jest.fn().mockReturnValue('requestId') };
      const log = jest.fn();
      const proxyHandler = buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid });
      const req = {
        get: jest.fn(),
        method: 'POST',
        url: '/L0/compile',
        headers: {},
        body: 'body',
        agent: httpsAgent
      };
      const res = {};
      const next = jest.fn();

      // Act
      await expect(proxyHandler(req, res, next)).resolves.toBe();

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://foo.bar.com/L0/compile', {
        method: 'POST',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: 'body',
        agent: httpsAgent
      });
    });
    it('use httpAgent for http protocol', async () => {
      // Arrange
      const httpAgent = 'httpAgent';
      const httpsAgent = 'httpsAgent';
      const config = {
        proxy: {
          targets: [
            'https://foo.bar.com',
            'http://foo.bar.com',
          ]
        }
      };
      const getConfig = jest.fn().mockReturnValue(config);
      const targetRes = {
        text: jest.fn().mockResolvedValue('body'),
        json: jest.fn()
      };
      const fetch = jest.fn().mockResolvedValue(targetRes);
      const uuid = { v4: jest.fn().mockReturnValue('requestId') };
      const log = jest.fn();
      const proxyHandler = buildProxyHandler({ httpAgent, httpsAgent, log, getConfig, fetch, uuid });
      const req = {
        get: jest.fn(),
        method: 'GET',
        url: '/L0/version',
        headers: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      await expect(proxyHandler(req, res, next)).resolves.toBe();

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenNthCalledWith(1, 'https://foo.bar.com/L0/version', {
        method: 'GET',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: null,
        agent: httpsAgent
      });
      expect(fetch).toHaveBeenNthCalledWith(2, 'http://foo.bar.com/L0/version', {
        method: 'GET',
        headers: {
          'x-graffiticode-request-id': 'requestId'
        },
        body: null,
        agent: httpAgent
      });
    });
  });
});
