import { IAM, Lambda, ApiGatewayV2 } from 'aws-sdk';
import { displayTextWithSpinner, delay, fsPromise, zip } from './../../utils';

import { buildGetIAM, buildGetLambda, buildGetApiGatewayV2 } from './aws';
import buildGetRole from './get-role';
import buildUpdateCode from './update-code';
import buildUpdateConfiguration from './update-configuration';
import buildUpdateApiGateway from './update-api-gateway';
import buildLambdaDeployer from './lambda-deployer';

const { readFile } = fsPromise;

const getIAM = buildGetIAM({ IAM });
const getLambda = buildGetLambda({ Lambda });
const getApiGatewayV2 = buildGetApiGatewayV2({ ApiGatewayV2 });
const getRole = buildGetRole({ getIAM });
const updateCode = buildUpdateCode({ getLambda, getRole, readFile, delay });
const updateConfiguration = buildUpdateConfiguration({ getLambda });
const updateApiGateway = buildUpdateApiGateway({ getApiGatewayV2, getRole });
const lambdaDeployer = buildLambdaDeployer({ displayTextWithSpinner, zip, updateCode, updateApiGateway });

export {
  lambdaDeployer,
};
