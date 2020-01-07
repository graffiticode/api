import { URL } from 'url';
import { IAM, Lambda, ApiGatewayV2 } from 'aws-sdk';
import { displayTextWithSpinner, delay, fsPromise, zip } from './../../utils';

import { buildGetIAM, buildGetLambda, buildGetApiGatewayV2 } from './aws';
import buildGetRole from './get-role';
import buildUpdateCode from './update-code';
import buildUpdateApiGateway from './update-api-gateway';
import { buildMakeUpdateApiConfigurationCallback, buildLambdaDeployer } from './lambda-deployer';

const { readFile, unlink, writeFile } = fsPromise;
const parseURL = (input) => new URL(input);

const getIAM = buildGetIAM({ IAM });
const getLambda = buildGetLambda({ Lambda });
const getApiGatewayV2 = buildGetApiGatewayV2({ ApiGatewayV2 });
const getRole = buildGetRole({ getIAM });
const updateCode = buildUpdateCode({ getLambda, getRole, readFile, delay });
const updateApiGateway = buildUpdateApiGateway({ getApiGatewayV2, getRole });
const makeUpdateApiConfigurationCallback = buildMakeUpdateApiConfigurationCallback({
  getLambda,
  parseURL,
  readFile,
  unlink,
  writeFile,
  zip,
});
const lambdaDeployer = buildLambdaDeployer({ displayTextWithSpinner, zip, updateCode, updateApiGateway, makeUpdateApiConfigurationCallback });

export {
  lambdaDeployer,
};
