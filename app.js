const _ = require('underscore');
const bodyParser = require("body-parser");
const errorHandler = require("errorhandler");
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const methodOverride = require("method-override");
const morgan = require("morgan");
const routes = require('./routes');
const {decodeID, encodeID} = require('./src/id.js');
const {dbQuery, getItems, getItem, postItem, updateItem, updateAST, updateOBJ} = require('./src/db.js');
const {delCache, getCache, setCache} = require('./src/cache.js');
const {compileID} = require('./src/comp.js');
const {pingLang, getCompilerVersion, getCompilerHost, getCompilerPort} = require('./src/lang.js');
const {parseJSON, cleanAndTrimObj, cleanAndTrimSrc} = require('./src/utils.js');
const {postAuth} = require('./src/auth.js');
const {getCode, putCode} = require('./src/code.js');
const {getData, putData} = require('./src/data.js');
const {getForm} = require('./src/form.js');

const app = module.exports = express();

// Configuration
const DEBUG = process.env.DEBUG_GRAFFITICODE === 'true' || false;
const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const CONFIG = global.config = {
  isLocalCompiles: LOCAL_COMPILES,
};
var env = process.env.NODE_ENV || 'development';

global.protocol = http; // Default. Set to http if localhost.

// http://stackoverflow.com/questions/7013098/node-js-www-non-www-redirection
// http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
app.all('*', function (req, res, next) {
  if (req.headers.host.match(/^localhost/) === null) {
    // if (req.headers.host.match(/^www/) === null) {
    //   console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
    //   res.redirect('https://www.'+ req.headers.host + req.url);
    // } else
    if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
      console.log("app.all redirecting headers=" + JSON.stringify(req.headers, null, 2) + " url=" + req.url);
      res.redirect(['https://', req.headers.host, req.url].join(''));
    } else {
      next();
    }
  } else {
    global.protocol = http;
    next();
  }
});

app.set('views', __dirname + '/views');
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.urlencoded({ extended: false, limit: 100000000 }));
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.raw({limit: '50mb'}));
app.use(bodyParser.json({ type: 'application/vnd.api+json', limit: '50mb' }));
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/lib'));
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.sendStatus(500);
});
app.engine('html', function (templateFile, options, callback) {
  fs.readFile(templateFile, function (err, templateData) {
    var template = _.template(String(templateData));
    callback(err, template(options))
  });
});

// Routes

var request = require('request');

// Client login
const clientAddress = global.clientAddress = process.env.ARTCOMPILER_CLIENT_ADDRESS
  ? process.env.ARTCOMPILER_CLIENT_ADDRESS
  : "0x0123456789abcdef0123456789abcdef01234567";
let authToken = process.env.ARTCOMPILER_CLIENT_SECRET;
if (!module.parent) {
  var port = global.port = process.env.PORT || 3000;
  app.listen(port, async function() {
    console.log("Listening on " + port);
    console.log("Using address " + clientAddress);
    if (!authToken) {
      // Secret not stored in env so get one.
      console.log("ARTCOMPILER_CLIENT_SECRET not set. Generating a temporary secret.");
      postAuth("/login", {
        "address": clientAddress,
      }, (err, data) => {
        postAuth("/finishLogin", {
          "jwt": data.jwt,
        }, (err, data) => {
          // Default auth token.
          authToken = data.jwt;
        });
      });
    }
  });
}

app.use('/items', routes.items(authToken, getItems));
app.use('/form', routes.form(authToken, getForm));
app.use('/code', routes.code(authToken, getCode, putCode));
app.use('/data', routes.data(authToken, getData));
app.use('/d', routes.d(authToken, getData));

app.get("/:lang/*", function (req, response) {
  // /L106/lexicon.js
  let lang = req.params.lang;
  pingLang(lang, pong => {
    if (pong) {
      let url = req.url;
      let path = url.substring(url.indexOf(lang) + lang.length + 1);
      var data = [];
      var options = {
        host: getCompilerHost(lang, config),
        port: getCompilerPort(lang, config),
        path: "/" + path,
      };
      req = protocol.get(options, function(res) {
        res.on("data", function (chunk) {
          data.push(chunk);
        }).on("end", function () {
          response.send(data.join(""));
        });
      });
    } else {
      response.sendStatus(404);
    }
  });
});

dbQuery("SELECT NOW() as when", (err, result) => {
  if (err) {
    console.error(err.stack);
    process.exit(1);
  }
  if (result.rows.length > 0) {
    console.log(`Database Time: ${result.rows[0].when}`);
  }
});

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler({dumpExceptions: true, showStack: true}))
}

if (process.env.NODE_ENV === 'production') {
  app.use(errorHandler())
}

process.on('uncaughtException', function(err) {
  console.log('ERROR Caught exception: ' + err.stack);
});
