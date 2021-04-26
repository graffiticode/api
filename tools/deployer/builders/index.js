import { tmpdir } from 'os';
import { join } from 'path';
import childProcess from 'child_process';
import { promisify } from 'util';
import { fsPromise, displayTextWithSpinner } from '../utils';

const exec = promisify(childProcess.exec);
const { mkdtemp, copyFile, stat } = fsPromise;

import buildNpmBuilder from './npm';
import buildBuildCompiler from './build';

const npmBuilder = buildNpmBuilder({ stat, copyFile, join, tmpdir, exec, mkdtemp, displayTextWithSpinner });
const buildCompiler = buildBuildCompiler({ npmBuilder });

export default buildCompiler;

export {
  buildCompiler,
  npmBuilder,
};
