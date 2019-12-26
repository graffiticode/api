import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { IAM, Lambda, ApiGatewayV2 } from 'aws-sdk';
import { displayTextWithSpinner, delay, fsPromise } from '../utils';

import buildZip from './zip';
import buildAwsLambdaDeployer from './aws-lambda';
import buildDeployCompiler from './deploy';

const exec = promisify(childProcess.exec);
const { readFile } = fsPromise;

const zip = buildZip({ exec, path });
const awsLambdaDeployer = buildAwsLambdaDeployer({ displayTextWithSpinner, delay, readFile, zip, IAM, Lambda, ApiGatewayV2 });
const deployCompiler = buildDeployCompiler({ awsLambdaDeployer });

export default deployCompiler;

export {
  deployCompiler,
  awsLambdaDeployer,
};
