import { Router } from 'express';
import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
import uuid from 'uuid';

import { getConfig } from './../config';
import { pingLang, getAsset } from './../lang';
import { isNonEmptyString } from './../util'

import compile from './compile';
import buildConfigHandler from './config';
import { buildLangRouter } from './lang';
import buildProxyHandler from './proxy';
import root from './root';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const configHandler = buildConfigHandler({ getConfig });
const langRouter = buildLangRouter({
  newRouter: () => new Router(),
  isNonEmptyString,
  pingLang,
  getAsset,
});

const proxyHandler = buildProxyHandler({
  httpAgent,
  httpsAgent,
  log: console.log,
  getConfig,
  fetch,
  uuid,
});

export {
  compile,
  langRouter,
  configHandler,
  proxyHandler,
  root,
}
