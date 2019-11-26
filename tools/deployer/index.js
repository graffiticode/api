import handleCompilers from './runners';

const config = {
  sync: true,
  aws: {
    region: 'us-east-2',
  },
};
const compilers = [{
  name: 'L0',
  repository: {
    type: 'git',
    url: 'https://github.com/KevinDyer/L0',
    branch: 'fix-babel-dep',
  },
  build: {
    type: 'npm',
    fileList: [
      'lib',
      'pub',
      'routes',
      'app.js',
      'config.json',
      'lambda.js',
    ],
  },
  deploy: {
    type: 'aws-lambda',
    handler: 'lambda.handler',
    zip: {},
  },
}, {
  name: 'L1',
  repository: {
    type: 'git',
    url: 'https://github.com/graffiticode/L1',
  },
  build: {
    type: 'npm',
    scripts: {
      build: 'compile',
    },
  },
  deploy: {
    type: 'aws-lambda',
    handler: 'build/src/lambda.handler',
    zip: {},
  },
}, {
  name: 'api',
  repository: {
    type: 'git',
    url: 'https://github.com/graffiticode/api',
  },
  build: {
    type: 'npm',
  },
  deploy: {
    type: 'aws-lambda',
    handler: 'build/src/deploy/index.lambdaHandler',
    zip: {},
  },
}];

handleCompilers({ compilers, config });
