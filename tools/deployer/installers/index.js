import path from 'path';
import { Clone } from 'nodegit';
import { mkdtemp, displayTextWithSpinner } from '../utils';

import buildGitInstaller from './git';
import buildLocalInstaller from './local';
import buildInstallProject from './install';

const gitInstaller = buildGitInstaller({ mkdtemp, Clone, displayTextWithSpinner });
const localInstaller = buildLocalInstaller({ path, displayTextWithSpinner });
const installProject = buildInstallProject({ gitInstaller, localInstaller });

export default installProject;

export {
  installProject,
  gitInstaller,
  localInstaller,
};
