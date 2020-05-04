import * as bent from 'bent';
import { getConfig } from '../config';
import { isNonEmptyString, getCompilerHost, getCompilerPort } from '../util';

import { buildGetBaseUrlForLanguage } from './base-url';
import { buildPingPong } from './ping-pong';

export const getBaseUrlForLanguage = buildGetBaseUrlForLanguage({
  isNonEmptyString,
  env: process.env,
  getConfig,
  getCompilerHost,
  getCompilerPort,
});

export const pingPong = buildPingPong({
  getBaseUrlForLanguage,
  bent,
});
