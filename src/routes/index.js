import { getConfig } from './../config';

import compile from './compile';
import buildConfigHandler from './config';
import lang from './lang';
import root from './root';

const configHandler = buildConfigHandler({ getConfig });

export {
  compile,
  configHandler,
  lang,
  root,
};
