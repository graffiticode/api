const errorHandler = require('errorhandler');
const express = require('express');
const http = require('http');
const https = require('https');
const methodOverride = require('method-override');
const morgan = require('morgan');
const routes = require('./routes');
const port = global.port = process.env.PORT || 3100;
const env = process.env.NODE_ENV || 'development';

// This line is required to ensure the typescript compiler moves the default
// config into the build directory.
// TODO(kevindyer) Refactor the creation of the app to inject the config
require('./../configs/config.json');

global.config = require(process.env.CONFIG || './../configs/config.json');
global.config.useLocalCompiles = process.env.LOCAL_COMPILES === 'true';
global.protocol = (global.config.useLocalCompiles || global.config.protocol === 'http') && http || https;

const app = module.exports = express();
app.all('*', (req, res, next) => {
  if (req.headers.host.match(/^localhost/) === null) {
    if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
      console.log('app.all redirecting headers=' + JSON.stringify(req.headers, null, 2) + ' url=' + req.url);
      res.redirect(['https://', req.headers.host, req.url].join(''));
    } else {
      next();
    }
  } else {
    next();
  }
});

if (env === 'development') {
  app.use(morgan('dev'));
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  }));
}
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride());
app.use(routes.proxyHandler);

// Error handling
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.sendStatus(500);
});

// Routes
app.use('/', routes.root());
app.use('/compile', routes.compile());
app.use('/lang', routes.lang());
app.use('/L*', routes.lang());
app.use('/config', routes.configHandler);

process.on('uncaughtException', (err) => {
  console.log(`ERROR Caught exception: ${err.stack}`);
});

if (!module.parent) {
  app.listen(port, () => {
    console.log(`Listening on ${port}...`);
  });
}
