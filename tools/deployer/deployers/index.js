import { lambdaDeployer } from './aws';

import buildDeployCompiler from './deploy';

const deployCompiler = buildDeployCompiler({ lambdaDeployer });

export default deployCompiler;

export {
  deployCompiler,
}; 
