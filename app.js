/**
 * Module dependencies.
 */

function print(str) {
  process.stdout.write(str);
}
const assert = require('assert');
var express = require('express');
var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var https = require('https');
var app = module.exports = express();
var morgan = require("morgan");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var errorHandler = require("errorhandler");
var pg = require('pg');
var redis = require('redis');
var cache; // = redis.createClient(process.env.REDIS_URL);
var main = require('./src/main.js');
const atob = require("atob");
const {decodeID, encodeID} = require('./src/id.js');
const routes = require('./routes');

// Configuration
const DEBUG = process.env.DEBUG === 'true' || false;
const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const LOCAL_DATABASE = process.env.LOCAL_DATABASE === 'true' || false;

if (LOCAL_DATABASE) {
  pg.defaults.ssl = false;
} else {
  pg.defaults.ssl = true;
}

const conStrs = [
  LOCAL_DATABASE ? process.env.DATABASE_URL_LOCAL
    : DEBUG ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL,
];

function getConStr(id) {
  return conStrs[0];
}

var env = process.env.NODE_ENV || 'development';

let protocol = http; // Default. Set to http if localhost.

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
    protocol = http;
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

// http://stackoverflow.com/questions/10435407/proxy-with-express-js
var request = require('request');

// app.get("/", (req, res) => {
//   let proto = req.headers['x-forwarded-proto'] || "http";
//   if (aliases["home"]) {
//     request([proto, "://", req.headers.host, "/form?id=" + aliases["home"]].join("")).pipe(res);
//   } else {
//     request([proto, "://", req.headers.host, "/form?id=q1yU91wYFN"].join("")).pipe(res);
//   }
// });

const aliases = {};
function dbQuery(query, resume) {
  let conString = getConStr(0);
  // Query Helper -- https://github.com/brianc/node-postgres/issues/382
  pg.connect(conString, function (err, client, done) {
    // If there is an error, client is null and done is a noop
    if (err) {
      console.log("ERROR [1] dbQuery() err=" + err);
      return resume(err, {});
    }
    try {
      client.query(query, function (err, result) {
        done();
        if (err) {
          throw new Error(err + ": " + query);
        }
        if (!result) {
          result = {
            rows: [],
          };
        }
        return resume(err, result);
      });
    } catch (e) {
      console.log("ERROR [2] dbQuery() e=" + e);
      done();
      return resume(e);
    }
  });
}

function getItem(itemID, resume) {
  dbQuery("SELECT * FROM pieces WHERE id = " + itemID, (err, result) => {
    // Here we get the language associated with the id. The code is gotten by
    // the view after it is loaded.
    let val;
    if (!result || !result.rows || result.rows.length === 0 || result.rows[0].id < 1000) {
      // Any id before 1000 was experimental
      resume("Bad ID", null);
    } else {
      //assert(result.rows.length === 1);
      val = result.rows[0];
      resume(err, val);
    }
  });
};

const localCache = {};

function delCache (id, type) {
  let key = id + type;
  delete localCache[key];
  if (cache) {
    cache.del(key);
  }
}

function renCache (id, oldType, newType) {
  let oldKey = id + oldType;
  let newKey = id + newType;
  localCache[newKey] = localCache[oldKey];
  delete localCache[oldKey];
  if (cache) {
    cache.rename(oldKey, newKey);
  }
}

function getKeys (filter, resume) {
  filter = filter || "*";
  cache.keys(filter, resume);
}

function getCache (id, type, resume) {
  let key = id + type;
  let val;
  if ((val = localCache[key])) {
    resume(null, val);
  } else if (cache) {
    cache.get(key, (err, val) => {
      resume(null, type === "data" ? parseJSON(val) : val);
    });
  } else {
    resume(null, null);
  }
}

const dontCache = ["L124"];

function setCache (lang, id, type, val) {
  if (!DEBUG && !dontCache.includes(lang)) {
    let key = id + type;
    localCache[key] = val;
    if (cache) {
      cache.set(key, type === "data" ? JSON.stringify(val) : val);
    }
  }
};

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("ERROR parsing JSON: " + JSON.stringify(str));
    console.log(e.stack);
    return null;
  }
}

function get(language, path, resume) {
  var data = [];
  var options = {
    host: getCompilerHost(language),
    port: getCompilerPort(language),
    path: "/" + path,
  };
  var req = protocol.get(options, function(res) {
    res.on("data", function (chunk) {
      data.push(chunk);
    }).on("end", function () {
      resume([], data.join(""));
    }).on("error", function () {
      resume(["ERROR"], "");
    });
  });
}

const lexiconCache = {};
function parse(lang, src, resume) {
  let lexicon;
  if ((lexicon = lexiconCache[lang])) {
    main.parse(src, lexicon, resume);
  } else {
    get(lang, "lexicon.js", function (err, data) {
      const lstr = data.substring(data.indexOf("{"));
      lexicon = JSON.parse(lstr);
      lexiconCache[lang] = lexicon;
      main.parse(src, lexicon, resume);
    });
  }
}

app.use('/label', routes.label(dbQuery));
app.use('/stat', routes.stat(dbQuery));

function sendForm (id, req, res) {
  let ids = decodeID(id);
  if (ids[1] === 0 && aliases[id]) {
    // ID is an invalid ID but a valid alias, so get aliased ID.
    ids = decodeID(aliases[id]);
  }
  let langID = ids[0] ? ids[0] : 0;
  let codeID = ids[1] ? ids[1] : 0;
  if (codeID === 0) {
    console.log("[1] GET /form ERROR 404 id=" + id + " ids=" + ids.join("+"));
    res.sendStatus(404);
    return;
  }
  if (!/[a-zA-Z]/.test(id)) {
    res.redirect("/form?id=" + encodeID(ids));
    return;
  }
  if (langID !== 0) {
    let lang = langName(langID);
    getCompilerVersion(lang, (version) => {
      res.render('form.html', {
        title: 'Graffiti Code',
        language: lang,
        item: encodeID(ids),
        view: "form",
        version: version,
        refresh: req.query.refresh,
      }, function (error, html) {
        if (error) {
          console.log("ERROR [1] GET /form err=" + error);
          res.sendStatus(400);
        } else {
          res.send(html);
        }
      });
    });
  } else {
    // Don't have a langID, so get it from the database item.
    getItem(codeID, function(err, row) {
      if (!row) {
        console.log("[2] GET /form ERROR 404 ");
        res.sendStatus(404);
      } else {
        var lang = row.language;
        getCompilerVersion(lang, (version) => {
          langID = lang.charAt(0) === "L" ? lang.substring(1) : lang;
          res.render('form.html', {
            title: 'Graffiti Code',
            language: lang,
            item: encodeID(ids),
            view: "form",
            version: version,
            refresh: req.query.refresh,
          }, function (error, html) {
            if (error) {
              console.log("ERROR [2] GET /form error=" + error);
              res.sendStatus(400);
            } else {
              res.send(html);
            }
          });
        });
      }
    });
  }
};

app.get("/form", function (req, res) {
  sendForm(req.query.id, req, res);
});

function sendData (auth, id, req, res) {
  let ids = decodeID(id);
  let refresh = !!req.query.refresh;
  let dontSave = !!req.query.dontSave;
  let options = {
    refresh: refresh,
    dontSave: dontSave,
  };
  let t0 = new Date;
  compileID(auth, id, options, (err, obj) => {
    if (err) {
      console.log("ERROR GET /data?id=" + ids.join("+") + " (" + id + ") err=" + err);
      res.sendStatus(400);
    } else {
      console.log("GET /data?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
      res.json(obj);
    }
  });
}

app.get("/data", (req, res) => {
  sendData(authToken, req.query.id, req, res);
});

app.get("/d/:id", (req, res) => {
  sendData(authToken, req.params.id, req, res);
});

function sendCode (id, req, res) {
  // Send the source code for an item.
  var ids = decodeID(id);
  var langID = ids[0];
  var codeID = ids[1];
  getItem(codeID, (err, row) => {
    if (!row) {
      console.log("[1] GET /code ERROR 404 ");
      res.sendStatus(404);
    } else {
      // No data provided, so obj code won't change.
      res.json({
        id: codeID,
        src: row.src,
      });
    }
  });
}

app.get('/code', (req, res) => {
  sendCode(req.query.id, req, res);
});

app.get("/c/:id", (req, res) => {
  sendCode(req.params.id, req, res);
});

let compilerVersions = {};
function getCompilerVersion(lang, resume) {
  // Compiler version tells which parser to use.
  if (compilerVersions[lang]) {
    resume(compilerVersions[lang]);
  } else {
    pingLang(lang, (pong) => {
      if (pong) {
        var data = [];
        var options = {
          host: getCompilerHost(lang),
          port: getCompilerPort(lang),
          path: "/version",
        };
        try {
          var req = protocol.get(options, function(res) {
            res.on("data", function (chunk) {
              data.push(chunk);
            }).on("end", function () {
              let str = data.join("");
              let version = parseInt(str.substring(1));
              version = compilerVersions[lang] = isNaN(version) ? 0 : version;
              resume(version);
            }).on("error", () => {
              resume(null);
            });
          });
        } catch (e) {
          console.log("[3] ERROR " + e.stack);
          resume(null);
        }
      } else {
        resume(null);
      }
    });
  }
}

function pingLang(lang, resume) {
  let options = {
    method: 'HEAD',
    host: getCompilerHost(lang),
    port: getCompilerPort(lang),
    path: '/'
  };
  req = protocol.request(options, function(r) {
    resume(true);
  }).on("error", (e) => {
    console.log("ERROR language unavailable: " + lang);
    resume(false);
  }).end();
}

function cleanAndTrimObj(str) {
  if (!str) {
    return str;
  }
  str = str.replace(new RegExp("'","g"), "''");
  str = str.replace(new RegExp("\n","g"), " ");
  while(str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

function cleanAndTrimSrc(str) {
  if (!str || typeof str !== "string") {
    return str;
  }
  str = str.replace(new RegExp("'","g"), "''");
  while(str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

// Commit and return commit id
function postItem(language, src, ast, obj, user, parent, img, label, forkID, resume) {
  parent = decodeID(parent)[1];
  // ast is a JSON object
  var forks = 0;
  var views = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));

  var queryStr =
    "INSERT INTO pieces (address, fork_id, user_id, parent_id, views, forks, created, src, obj, language, label, img, ast)" +
    " VALUES ('" + clientAddress + "','" + forkID + "','" + user + "','" + parent + " ','" + views + " ','" + forks + "',now(),'" + src + "','" + obj + "','" + language + "','" +
    label + "','" + img + "','" + ast + "');"
  dbQuery(queryStr, function(err, result) {
    if (err) {
      console.log("ERROR postItem() " + queryStr);
      resume(err);
    } else {
      var queryStr = "SELECT * FROM pieces ORDER BY id DESC LIMIT 1";
      dbQuery(queryStr, function (err, result) {
        let codeID = +result.rows[0].id;
        forkID = forkID || codeID;
        var query =
          "UPDATE pieces SET " +
          "fork_id=" + forkID + " " +
          "WHERE id=" + codeID;
        dbQuery(query, function (err) {
          resume(err, result);
          dbQuery("UPDATE pieces SET forks=forks+1 WHERE id=" + parent, () => {});
        });
      });
    }
  });
}

// Commit and return commit id
function updateItem(id, language, src, ast, obj, img, resume) {
  var views = 0;
  var forks = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE pieces SET " +
    "src='" + src + "'," +
    "ast='" + ast + "'," +
    "obj='" + obj + "'," +
    "img='" + img + "'" +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    resume(err, []);
  });
}

function countView(id) {
  var query =
    "UPDATE pieces SET " +
    "views=views+1 " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    if (err && err.length) {
      console.log("ERROR updateViews() err=" + err);
    }
  });
}

function updateAST(id, ast, resume) {
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE pieces SET " +
    "ast='" + ast + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    if (err && err.length) {
      console.log("ERROR updateAST() err=" + err);
    }
    resume(err, []);
  });
}

function updateOBJ(id, obj, resume) {
  obj = cleanAndTrimObj(JSON.stringify(obj));
  var query =
    "UPDATE pieces SET " +
    "obj='" + obj + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query, function (err) {
    resume(err, []);
  });
}

const nilID = encodeID([0,0,0]);
function getData(auth, ids, refresh, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    // Compile the tail.
    let id = encodeID(ids.slice(2));
    compileID(auth, id, {refresh: refresh}, resume);
  }
}

function getCode(ids, resume) {
  getItem(ids[1], (err, item) => {
    // if L113 there is no AST.
    if (item && item.ast) {
      let ast = typeof item.ast === "string" && JSON.parse(item.ast) || item.ast;
      resume(err, ast);
    } else {
      if (ids[0] !== 113) {
        console.log("No AST found: langID=" + ids[0] + " codeID=" + ids[1]);
        assert(item, "ERROR getCode() item not found: " + ids);
        let lang = item.language;
        let src = item.src.replace(/\\\\/g, "\\");
        parse(lang, src, (err, ast) => {
          updateAST(ids[1], ast, (err)=>{
            assert(!err);
          });
          // Don't wait for update.
          resume(err, ast);
        });
      } else {
        resume(err, {});
      }
    }
  });
}

function langName(id) {
  id = +id;
  return "L" + id;
}

function getLang(ids, resume) {
  let langID = ids[0];
  if (langID !== 0) {
    resume(null, langName(langID));
  } else {
    // Get the language name from the item.
    getItem(ids[1], (err, item) => {
      resume(err, item.language);
    });
  }
}

function compileID(auth, id, options, resume) {
  let refresh = options.refresh;
  let dontSave = options.dontSave;
  if (id === nilID) {
    resume(null, {});
  } else {
    let ids = decodeID(id);
    if (refresh) {
      delCache(id, "data");
    }
    getCache(id, "data", (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        countView(ids[1]);  // Count every time code is used to compile a new item.
        getData(auth, ids, refresh, (err, data) => {
          getCode(ids, (err, code) => {
            if (err && err.length) {
              resume(err, null);
            } else {
              getLang(ids, (err, lang) => {
                if (err && err.length) {
                  resume(err, null);
                } else {
                  if (lang === "L113" && Object.keys(data).length === 0) {
                    // No need to recompile.
                    getItem(ids[1], (err, item) => {
                      if (err && err.length) {
                        resume(err, null);
                      } else {
                        try {
                          let obj = JSON.parse(item.obj);
                          setCache(lang, id, "data", obj);
                          resume(err, obj);
                        } catch (e) {
                          // Oops. Missing or invalid obj, so need to recompile after all.
                          // Let downstream compilers know they need to refresh
                          // any data used. Prefer true over false.
                          comp(auth, lang, code, data, options, (err, obj) => {
                            if (err) {
                              resume(err);
                            } else {
                              setCache(lang, id, "data", obj);
                              resume(null, obj);
                            }
                          });
                        }
                      }
                    });
                  } else {
                    if (lang && code) {
                      assert(code.root !== undefined, "Invalid code for item " + ids[1]);
                      // Let downstream compilers know they need to refresh
                      // any data used.
                      comp(auth, lang, code, data, options, (err, obj) => {
                        if (err) {
                          resume(err);
                        } else {
                          if (!dontSave) {
                            setCache(lang, id, "data", obj);
                            if (ids[2] === 0 && ids.length === 3) {
                              // If this is pure code, then update OBJ.
                              updateOBJ(ids[1], obj, (err)=>{ assert(!err) });
                            }
                          }
                          resume(null, obj);
                        }
                      });
                    } else {
                      // Error handling here.
                      console.log("ERROR compileID() ids=" + ids + " missing code");
                      resume(null, {});
                    }
                  }
                }
              });
            }
          });
        });
      }
    });
  }
}

function comp(auth, lang, code, data, options, resume) {
  const config = { "messageToAlan": "Hello, Alan!" };
  pingLang(lang, pong => {
    if (pong) {
      // Compile ast to obj.
      var path = "/compile";
      var encodedData = JSON.stringify({
        "description": "graffiticode",
        "language": lang,
        "src": code,
        "data": data,
        "refresh": options.refresh,
        "config": config,
        "auth": auth,
      });
      var reqOptions = {
        host: getCompilerHost(lang),
        port: getCompilerPort(lang),
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(encodedData),
        },
      };
      var req = protocol.request(reqOptions, function(res) {
        var data = "";
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          resume(null, parseJSON(data));
        });
        res.on('error', function (err) {
          console.log("[1] comp() ERROR " + err);
          resume(408);
        });
      });
      req.write(encodedData);
      req.end();
      req.on('error', function(err) {
        console.log("[2] comp() ERROR " + err);
        resume(408);
      });
    } else {
      resume(404);
    }
  });
}

function parseID (id, options, resume) {
  let ids = decodeID(id);
  getItem(ids[1], (err, item) => {
    if (err && err.length) {
      resume(err, null);
    } else {
      // if L113 there is no AST.
      const lang = item.language;
      const src = item.src;
      if (src) {
        parse(lang, src, (err, ast) => {
          if (!ast || Object.keys(ast).length === 0) {
            console.log("NO AST for SRC " + src);
          }
          if (JSON.stringify(ast) !== JSON.stringify(item.ast)) {
            if (ids[1] && !options.dontSave) {
              console.log("Saving AST for id=" + id);
              updateAST(ids[1], ast, (err)=>{
                assert(!err);
                resume(err, ast);
              });
            } else {
              resume(err, ast);
            }
          } else {
            resume(err, ast);
          }
        });
      } else {
        resume(["ERROR no source. " + id]);
      }
    }
  });
};

function clearCache (type, items) {
  getKeys("*" + type, (err, keys) => {
    items = items || keys;
    let count = 0;
    items.forEach((item) => {
      item = item.indexOf(type) < 0 ? item + type : item; // Append type of not present.
      if (keys.indexOf(item) >= 0) {
        console.log("deleting " + (++count) + " of " + keys.length + ": " + item);
        delCache(item.slice(0, item.indexOf(type)), type);
      } else {
        console.log("unknown " + item);
      }
    });
  })
};

function getIDFromType (type) {
  // FIXME make this generic.
  switch (type) {
  default:
    return null;
  }
}

function batchCompile (auth, items, index, res, resume) {
  index = +index || 0;
  // For each item, get the dataID and concat with codeID of alias.
  if (index < items.length) {
    res && res.write(" ");
    let t0 = new Date;
    let item = items[index];
    let codeID = item.id || getIDFromType(item.type);
    let data = item.data;
    putData(auth, data, (err, dataID) => {
      let codeIDs = decodeID(codeID);
      let dataIDs = decodeID(dataID);
      let id = encodeID(codeIDs.slice(0,2).concat(dataIDs));
      item.id = id;
      item.image_url = "https://cdn.acx.ac/" + id + ".png";
      delete item.data;
      compileID(auth, id, {refresh: DEBUG}, (err, obj) => {
        item.data = obj;
        batchCompile(auth, items, index + 1, res, resume);
        console.log("COMPILE " + (index + 1) + "/" + items.length + ", " + id + " in " + (new Date - t0) + "ms");
      });
    });
  } else {
    resume(null, items);
  }
}

app.put('/comp', function (req, res) {
  let t0 = new Date;
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let data = body;
  let auth = req.headers.authorization;
  let date = new Date().toUTCString();
  postAuth("/validate", { jwt: auth }, (err, val) => {
    let t1 = new Date;
    console.log("postAuth() in " + (t1 - t0) + "ms");
    if (err) {
      res.sendStatus(err);
    } else {
      let address = val.address;
      let t2 = new Date;
      // console.log("putData() in " + (t2 - t1) + "ms");
      res.writeHead(202, {"Content-Type": "application/json"});
      batchCompile(auth, data, 0, res, (err, data) => {
        let t3 = new Date;
        console.log("batchCompile() in " + (t3 - t2) + "ms");
        res.end(JSON.stringify(data));
        let itemIDs = [];
        let doScrape;
        let str = "grid [\n";
        str += 'row twelve-columns [br, ';
        str += 'style { "fontSize": "14"} cspan "Client: ' + address + '", ';
        str += 'style { "fontSize": "14"} cspan "Posted: ' + date + '"';
        str += '],\n';
        data.forEach((val, i) => {
          itemIDs.push(val.id);
          let langID = decodeID(val.id)[0];
          if (langID === 104) {
            str +=
            'row twelve-columns [href "item?id=' + val.id +
              '" img "https://cdn.acx.ac/' + val.id + '.png", h4 "' + (i + 1) +
              ' of ' + data.length + ': ' + val.id + '"],\n';
            doScrape = true;
          } else {
            // str +=
            //   'row twelve-columns [href "item?id=' + val.id +
            //   '" form "' + val.id + '", h4 "' + (i + 1) +
            //   ' of ' + data.length + ': ' + val.id + '"],\n';
          }
        });
        str += "]..";
        if (doScrape) {
          putCode(auth, "L116", str, async (err, val) => {
            console.log("PUT /comp proofsheet: https://acx.ac/form?id=" + val.id);
            let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
            batchScrape(browser, false, itemIDs, 0, () => {
              browser.close();
            });
          });
        }
        putData(auth, {
          address: address,
          type: "batchCompile",
          date: date,
          items: itemIDs,
        }, () => {}); // Record batch.
      });
    }
  });
});

function putData (auth, data, resume) {
  if (!data || !Object.keys(data).length) {
    resume(null, undefined);
    return;
  }
  let t0 = new Date;
  let rawSrc = JSON.stringify(data) + "..";
  let src = cleanAndTrimSrc(rawSrc);
  let obj = JSON.stringify(data);
  let lang = "L113";
  let user = 0;
  let query =
    "SELECT * FROM pieces WHERE language='" + lang +
    "' AND src='" + src + "' LIMIT 1";
  dbQuery(query, function(err, result) {
    // See if there is already an item with the same source for the same
    // language. If so, pass it on.
    var row = result.rows[0];
    let itemID = row && row.id ? row.id : undefined;
    // Might still be undefined if there is no match.
    if (itemID) {
      var src = row.src;
      var ast = row.ast;
      var img = row.img;
      var label = row.label;
      updateItem(itemID, lang, rawSrc, ast, obj, img, function (err, data) {
        if (err) {
          console.log("[8] ERROR " + err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
      let codeID = row.id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      resume(null, id);
    } else {
      var ast = null;
      var label = "data";
      var parent = 0;
      var img = "";
      let forkID = 0;
      postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = result.rows[0].id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        if (err) {
          console.log("ERROR putData() err=" + err);
          resume(err);
        } else {
          resume(null, id);
        }
      });
    }
  });
}

function putCode(auth, lang, rawSrc, resume) {
  let t0 = new Date;
  // Compile AST or SRC to OBJ. Insert or add item.
  let src = cleanAndTrimSrc(rawSrc);
  let user = 0;
  let img = "";
  let obj = "";
  let label = "show";
  let parent = 0;
  let query = "SELECT * FROM pieces WHERE language='" + lang + "' AND user_id='" + user + "' AND src = '" + src + "' ORDER BY pieces.id";
  dbQuery(query, function(err, result) {
    var row = result.rows[0];
    itemID = row && row.id || undefined;
    ast = row && row.ast || null;
    if (!ast) {
      // No AST, try creating from source.
      parse(lang, rawSrc, (err, ast) => {
        compile(ast);
      });
    } else {
      compile(ast);
    }
    function compile(ast) {
      if (itemID) {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = row.id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        // We have an id, so update the item with the current AST.
        updateItem(itemID, lang, rawSrc, ast, obj, img, (err) => {
          // Update the src and ast because they are used by compileID().
          if (err) {
            console.log("ERROR [1] PUT /compile err=" + err);
            resume(400, null);
          } else {
            compileID(auth, id, {}, (err, obj) => {
              // console.log("putCode() id=" + ids.join("+") + " (" + id + ") in " +
              //             (new Date - t0) + "ms");
              resume(null, {
                id: id,
                obj: obj,
              });
            });
          }
        });
      } else {
        let forkID = 0;
        postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
          if (err) {
            console.log("ERROR [2] PUT /compile err=" + err);
            resume(400);
          } else {
            let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
            let codeID = result.rows[0].id;
            let dataID = 0;
            let ids = [langID, codeID, dataID];
            let id = encodeID(ids);
            compileID(auth, id, {}, (err, obj) => {
              console.log("putCode() id=" + ids.join("+") + " (" + id + ")* in " +
                          (new Date - t0) + "ms");
              resume(null, {
                id: id,
                obj: obj,
              });
            });
          }
        });
      }
    }
  });
}

app.put('/code', (req, response) => {
  // Insert or update code without recompiling.
  let t0 = new Date;
  let body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let id = body.id;
  let ids = id !== undefined ? decodeID(id) : [0, 0, 0];
  let rawSrc = body.src
  let src = cleanAndTrimSrc(rawSrc);
  let lang = body.language;
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  let user = req.body.userID || dot2num(ip);
  let query;
  let itemID = id && +ids[1] !== 0 ? ids[1] : undefined;
  if (itemID !== undefined) {
    // Prefer the given id if there is one.
    query = "SELECT * FROM pieces WHERE id='" + itemID + "'";
  } else {
    // Otherwise look for an item with matching source.
    query = "SELECT * FROM pieces WHERE language='" + lang + "' AND src = '" + src + "' ORDER BY pieces.id";
  }
  dbQuery(query, function(err, result) {
    // See if there is already an item with the same source for the same
    // language. If so, pass it on.
    var row = result.rows[0];
    itemID = itemID ? itemID : row ? row.id : undefined;
    // Might still be undefined if there is no match.
    if (itemID) {
      var lang = row.language;
      var src = body.src ? body.src : row.src;
      var ast = body.ast ? JSON.parse(body.ast) : row.ast;
      var obj = body.obj ? body.obj : row.obj;
      var parent = body.parent ? body.parent : row.parent_id;
      var img = body.img ? body.img : row.img;
      var label = body.label ? body.label : row.label;
      updateItem(itemID, lang, rawSrc, ast, obj, img, function (err, data) {
        if (err) {
          console.log("[9] ERROR " + err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
      let codeID = result.rows[0].id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      console.log("PUT /code?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms");
      response.json({
        id: id,
      });
    } else {
      var src = body.src;
      var lang = body.language;
      var ast = body.ast ? JSON.parse(body.ast) : null;  // Possibly undefined.
      var obj = body.obj;
      var label = body.label;
      var parent = body.parent ? body.parent : 0;
      var img = "";
      let forkID = 0;
      postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = result.rows[0].id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        if (err) {
          console.log("ERROR PUT /code err=" + err);
          response.sendStatus(400);
        } else {
          console.log("PUT /code?id=" + ids.join("+") + " (" + id + ")* in " +
                      (new Date - t0) + "ms");
          response.json({
            id: id,
          });
        }
      });
    }
  });
});

app.get('/items', function(req, res) {
  // Used by L109, L131.
  let userID = req.query.userID;
  let queryStr = "";
  let table = req.query.table || "pieces";
  if (req.query.list) {
    let list = req.query.list;
    queryStr =
      "SELECT * FROM " + table + " WHERE pieces.id" +
      " IN ("+list+") ORDER BY id DESC";
  } else if (req.query.where) {
    let fields = req.query.fields ? req.query.fields : "id";
    let limit = req.query.limit;
    let where = req.query.where;
    queryStr =
      "SELECT " + fields +
      " FROM " + table + " WHERE " + where +
      " ORDER BY id DESC" +
      (limit ? " LIMIT " + limit : "");
  } else {
    console.log("ERROR [1] GET /items");
    res.sendStatus(400);
  }
  dbQuery(queryStr, function (err, result) {
    var rows;
    if (!result || result.rows.length === 0) {
      rows = [];
    } else {
      rows = result.rows;
    }
    let mark = req.query.stat && req.query.stat.mark;
    if (mark !== undefined) {
      dbQuery("SELECT codeid FROM items WHERE " +
              "userid='" + userID +
              "' AND mark='" + mark + "'",
              (err, result) => {
                let list = [];
                result.rows.forEach(row => {
                  list.push(row.codeid);
                });
                let selection = [];
                rows.forEach(row => {
                  if (list.includes(row.id)) {
                    selection.push(row);
                  }
                });
                console.log("GET /items selection=" + JSON.stringify(selection));
                res.send(selection)
              });
    } else {
      res.send(rows);
    }
  });
  req.on('error', function(e) {
    console.log("[10] ERROR " + e);
    console.log("ERROR [2] GET /items err=" + err);
    res.sendStatus(400);
  });
});

// From http://javascript.about.com/library/blipconvert.htm
function dot2num(dot) {
  var d = dot.split('.');
  var n = ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}
function num2dot(num) {
  var d = num%256;
  for (var i = 3; i > 0; i--) {
    num = Math.floor(num/256);
    d = num%256 + '.' + d;}
  return d;
}

app.get("/:lang/*", function (req, response) {
  // /L106/lexicon.js
  let lang = req.params.lang;
  pingLang(lang, pong => {
    if (pong) {
      let url = req.url;
      let path = url.substring(url.indexOf(lang) + lang.length + 1);
      var data = [];
      var options = {
        host: getCompilerHost(lang),
        port: getCompilerPort(lang),
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

function getCompilerHost(lang, options) {
  if (LOCAL_COMPILES && port === 3000) {
    return "localhost";
  } else {
    return lang + ".artcompiler.com";
  }
}

function getCompilerPort(lang) {
  if (LOCAL_COMPILES && port === 3000) {
    return "5" + lang.substring(1);  // e.g. L103 -> 5103
  } else {
    return "80";
  }
}

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

function postAuth(path, data, resume) {
  let encodedData = JSON.stringify(data);
  var options = {
    host: "auth.artcompiler.com",
    port: "443",
    path: path,
    method: "POST",
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(encodedData),
    },
  };
  var req = https.request(options);
  req.on("response", (res) => {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    }).on('end', function () {
      if (res.statusCode === 401) {
        resume(res.statusCode, data);
      } else {
        try {
          data = JSON.parse(data);
          resume(data.error, data);
        } catch (e) {
          console.log("[11] ERROR " + data + " statusCode=" + res.statusCode);
          console.log(e.stack);
        }
      }
    }).on("error", function () {
      console.log("error() status=" + res.statusCode + " data=" + data);
    });
  });
  req.end(encodedData);
  req.on('error', function(err) {
    console.log("[12] ERROR " + err);
    resume(err);
  });
}

// Client login

const clientAddress = process.env.ARTCOMPILER_CLIENT_ADDRESS
  ? process.env.ARTCOMPILER_CLIENT_ADDRESS
  : "0x0123456789abcdef0123456789abcdef01234567";
let authToken = process.env.ARTCOMPILER_CLIENT_SECRET;
if (!module.parent) {
  var port = process.env.PORT || 3000;
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
