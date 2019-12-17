import { Clone } from 'nodegit';
import { tmpdir } from 'os';
import { join } from 'path';
import { fsPromise, displayTextWithSpinner } from '../utils';

import buildGitInstaller from './git';
import buildLocalInstaller from './local';
import buildInstallProject from './install';

const gitInstaller = buildGitInstaller({ Clone, displayTextWithSpinner, fsPromise, join, tmpdir });
const localInstaller = buildLocalInstaller({ path, displayTextWithSpinner });
const installProject = buildInstallProject({ gitInstaller, localInstaller });

export default installProject;

export {
  installProject,
  gitInstaller,
  localInstaller,
};
