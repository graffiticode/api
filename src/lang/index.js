import bent from 'bent';
import { getConfig } from '../config';
import { isNonEmptyString, getCompilerHost, getCompilerPort } from '../util';

import { buildGetBaseUrlForLanguage } from './base-url';
import { buildGetAsset } from './get-asset';
import { buildPingLang } from './ping-lang';

export const getBaseUrlForLanguage = buildGetBaseUrlForLanguage({
  isNonEmptyString,
  env: process.env,
  getConfig,
  getCompilerHost,
  getCompilerPort,
});

export const getAsset = buildGetAsset({
  getBaseUrlForLanguage,
  bent,
});

export const pingLang = buildPingLang({
  getBaseUrlForLanguage,
  bent,
});
