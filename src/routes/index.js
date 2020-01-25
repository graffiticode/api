import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
import uuid from 'uuid';

import { getConfig } from './../config';

import compile from './compile';
import lang from './lang';
import buildConfigHandler from './config';
import buildProxyHandler from './proxy';
import root from './root';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const configHandler = buildConfigHandler({ getConfig });

const proxyHandler = buildProxyHandler({
  httpAgent,
  httpsAgent,
  log: console.log,
  getConfig: () => global.config,
  fetch,
  uuid,
});

export {
  compile,
  lang,
  configHandler,
  proxyHandler,
  root,
}
