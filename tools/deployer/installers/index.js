import path from 'path';
import { Clone } from 'nodegit';
import { mkdtemp, displayTextWithSpinner } from '../utils';

import buildGitGetter from './git';
import buildLocalGetter from './local';
import buildGetCompiler from './install';

const gitGetter = buildGitGetter({ mkdtemp, Clone, displayTextWithSpinner });
const localGetter = buildLocalGetter({ path, displayTextWithSpinner });
const getCompiler = buildGetCompiler({ gitGetter, localGetter });

export default getCompiler;

export {
  getCompiler,
  gitGetter,
  localGetter,
};
