import childProcess from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { IAM, Lambda, ApiGatewayV2 } from 'aws-sdk';
import { displayTextWithSpinner, delay } from '../utils';

import buildZip from './zip';
import buildAwsLambdaDeployer from './aws-lambda';
import buildDeployCompiler from './deploy';

const exec = promisify(childProcess.exec);

const zip = buildZip({ exec, path });
const awsLambdaDeployer = buildAwsLambdaDeployer({ displayTextWithSpinner, delay, fs, zip, IAM, Lambda, ApiGatewayV2 });
const deployCompiler = buildDeployCompiler({ awsLambdaDeployer });

export default deployCompiler;

export {
  deployCompiler,
  awsLambdaDeployer,
};
