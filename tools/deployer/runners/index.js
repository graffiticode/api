import parseArgs from 'minimist';

import installProject from '../installers';
import buildProject from './../builders';
import deployProject from './../deployers';
import { fsPromise } from './../utils';

import buildMakeConfig from './config';
import { buildRunProject, buildPostRunProject } from './project';
import buildRunProjects from './projects';

const parseArgsOptions = { string: ['config'], alias: { config: ['c'] } };
const flags = parseArgs(process.argv.slice(2), parseArgsOptions);

const makeConfig = buildMakeConfig({ fsPromise, flags });
const runProject = buildRunProject({ installProject, buildProject, deployProject });
const runProjects = buildRunProjects({ runProject, buildPostRunProject });

export {
  makeConfig,
  runProject,
  runProjects,
};
