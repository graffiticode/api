const errorHandler = require('errorhandler');
const express = require('express');
const http = require('http');
const https = require('https');
const methodOverride = require('method-override');
const morgan = require('morgan');
const routes = require('./routes');
const port = global.port = process.env.PORT || 3100;
const env = process.env.NODE_ENV || 'development';

global.config = require(process.env.CONFIG || './config.json');
global.config.useLocalCompiles = process.env.LOCAL_COMPILES === 'true';
global.protocol = !global.config.useLocalCompiles && global.config.protocol === 'https' && https || http;

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

app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
}));
app.use(express.json({ limit: '50mb' }));
app.use(methodOverride());

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler({dumpExceptions: true, showStack: true}))
} else if (process.env.NODE_ENV === 'production') {
  app.use(errorHandler())
}
app.use((err, req, res, next) => res.sendStatus(500));

// Routes
app.use('/', routes.root());
app.use('/compile', routes.compile());
app.use('/lang', routes.lang());
app.use('/L*', routes.lang());

process.on('uncaughtException', (err) => {
  console.log(`ERROR Caught exception: ${err.stack}`);
});

if (!module.parent) {
  app.listen(port, () => {
    console.log(`Listening on ${port}...`);
  });
}
