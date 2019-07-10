const bodyParser = require("body-parser");
const errorHandler = require("errorhandler");
const express = require('express');
const http = require('http');
const https = require('https');
const methodOverride = require("method-override");
const morgan = require("morgan");
const routes = require('./routes');
const app = module.exports = express();

global.config = require(process.env.CONFIG || "./config.json");
global.config.useLocalCompiles = process.env.LOCAL_COMPILES === "true";
global.protocol = !global.config.useLocalCompiles && global.config.protocol === "https" && https || http;

var env = process.env.NODE_ENV || 'development';

app.all('*', function (req, res, next) {
  if (req.headers.host.match(/^localhost/) === null) {
    if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
      console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
      res.redirect(['https://', req.headers.host, req.url].join(''));
    } else {
      next();
    }
  } else {
    next();
  }
});

app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.json({ type: 'application/json', limit: '50mb' }));

app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/lib'));
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.sendStatus(500);
});

// Routes

if (!module.parent) {
  var port = global.port = process.env.PORT || 3100;
  app.listen(port, async function() {
    console.log("Listening on " + port);
  });
}

app.use('/', routes.root());
app.use('/compile', routes.compile());
app.use('/lang', routes.lang());
app.use('/:path', routes.lang());

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler({dumpExceptions: true, showStack: true}))
}

if (process.env.NODE_ENV === 'production') {
  app.use(errorHandler())
}

process.on('uncaughtException', function(err) {
  console.log('ERROR Caught exception: ' + err.stack);
});
