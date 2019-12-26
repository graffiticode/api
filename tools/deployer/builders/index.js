import { promises as fs } from 'fs';
import path from 'path';
import childProcess from 'child_process';
import { promisify } from 'util';
import { fsPromise, displayTextWithSpinner } from '../utils';

const exec = promisify(childProcess.exec);

import buildNpmBuilder from './npm';
import buildBuildCompiler from './build';

const npmBuilder = buildNpmBuilder({ fs, path, exec, mkdtemp: fsPromise.mkdtemp, displayTextWithSpinner });
const buildCompiler = buildBuildCompiler({ npmBuilder });

export default buildCompiler;

export {
  buildCompiler,
  npmBuilder,
};
