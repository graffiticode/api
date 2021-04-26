import express, { Router } from 'express';
import request from 'supertest';
import { isNonEmptyString } from '../util';

import { buildLangRouter } from './lang';

describe.each([
  ['path param with L', (l, p) => `/L${l}${p}`],
  ['path param with l', (l, p) => `/l${l}${p}`],
  ['query param', (l, p) => `/lang${p}?id=${l}`],
])('lang router: %s', (name, getPath) => {
  it('should return languages asset', async () => {
    // Arrange
    const pong = true;
    const pingLang = jest.fn().mockResolvedValue(pong);
    const asset = 'asset';
    const getAsset = jest.fn().mockResolvedValue(asset);
    const langRouter = buildLangRouter({
      newRouter: () => new Router(),
      isNonEmptyString,
      pingLang,
      getAsset,
    });
    const app = express();
    app.use('/lang', langRouter);
    app.use('/L*', langRouter);

    // Act
    const res = await request(app)
      .get(getPath(42, '/thing'))
      .expect(200);

    // Assert
    expect(pingLang).toHaveBeenCalledWith('L42');
    expect(res.text).toBe(asset);
  });

  it('should return 400 if invalid lang id', async () => {
    // Arrange
    const langRouter = buildLangRouter({
      newRouter: () => new Router(),
      isNonEmptyString,
    });
    const app = express();
    app.use('/lang', langRouter);
    app.use('/L*', langRouter);

    // Act
    await request(app)
      .get(getPath('ab', '/thing'))
      .expect(400);

    // Assert
  });

  it('should return 404 is if ping fails', async () => {
    // Arrange
    const pong = false;
    const pingLang = jest.fn().mockResolvedValue(pong);
    const langRouter = buildLangRouter({
      newRouter: () => new Router(),
      isNonEmptyString,
      pingLang,
    });
    const app = express();
    app.use('/lang', langRouter);
    app.use('/L*', langRouter);

    // Act
    await request(app)
      .get(getPath(42, '/thing'))
      .expect(404);

    // Assert
    expect(pingLang).toHaveBeenCalledWith('L42');
  });
});