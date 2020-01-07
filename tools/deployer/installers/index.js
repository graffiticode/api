import { Clone } from 'nodegit';
import { tmpdir } from 'os';
import { isAbsolute, join, resolve } from 'path';
import { fsPromise, displayTextWithSpinner } from '../utils';

import buildGitInstaller from './git';
import buildLocalInstaller from './local';
import buildInstallProject from './install';

const gitInstaller = buildGitInstaller({ Clone, displayTextWithSpinner, join, mkdtemp: fsPromise.mkdtemp, tmpdir });
const localInstaller = buildLocalInstaller({ isAbsolute, resolve, displayTextWithSpinner });
const installProject = buildInstallProject({ gitInstaller, localInstaller });

export default installProject;

export {
  installProject,
  gitInstaller,
  localInstaller,
};
