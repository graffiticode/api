import { getConfig } from '../config';
import { isNonEmptyString, getCompilerHost, getCompilerPort } from '../util';

import { buildGetBaseUrlForLanguage } from './base-url';

export const getBaseUrlForLanguage = buildGetBaseUrlForLanguage({
  isNonEmptyString,
  env: process.env,
  getConfig,
  getCompilerHost,
  getCompilerPort,
});