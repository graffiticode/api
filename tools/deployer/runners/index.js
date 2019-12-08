import getCompiler from '../installers';
import buildCompiler from './../builders';
import deployCompiler from './../deployers';

import buildHandleCompiler from './compiler';
import buildHandleCompilers from './compilers';

const handleCompiler = buildHandleCompiler({ getCompiler, buildCompiler, deployCompiler });
const handleCompilers = buildHandleCompilers({ handleCompiler });

export default handleCompilers;

export {
  handleCompiler,
  handleCompilers,
};
