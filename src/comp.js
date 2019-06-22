const assert = require('assert');
const {decodeID, encodeID} = require('./id.js');
const {dbQueryAsync, getItem, updateAST, updateOBJ} = require('./db.js');
const {delCache, getCache, setCache} = require('./cache.js');
const {pingLang, getCompilerVersion, getCompilerHost, getCompilerPort, parseJSON, cleanAndTrimObj, cleanAndTrimSrc} = require('./utils.js');

const nilID = encodeID([0,0,0]);

function getLang(ids, resume) {
  resume(null, "L" + ids[0]);
}

function getCode(ids, resume) {
  getAST(ids[1], (err, ast) => {
    resume(err, ast);
  });
}

function getData(auth, ids, refresh, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    // Compile the tail.
    let id = encodeID(ids.slice(2));
    compileID(auth, id, {refresh: refresh}, resume);
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

function getComp(auth, id, req, res) {
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

function comp(auth, lang, code, data, options, resume) {
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
        host: getCompilerHost(lang, global.config),
        port: getCompilerPort(lang, global.config),
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

function getIDFromType(type) {
  switch (type) {
  default:
    return null;
  }
}

// TODO
// -- Implement jsonToAST() to create an AST from a JSON value.
// -- Call codeToID(jsonToAST(data)) to get a codeID.
function compile(auth, item) {
  return new Promise((accept, reject) => {
    let t0 = new Date;
    let codeID = item.id || getIDFromType(item.type);
    let data = item.data;
    let dataID = codeToID(jsonToAST(data));
    let codeIDs = decodeID(codeID);
    let dataIDs = decodeID(dataID);
    let id = encodeID(codeIDs.slice(0,2).concat(dataIDs));
    compileID(auth, id, {refresh: DEBUG}, (err, obj) => {
      console.log("COMPILE " + id + " in " + (new Date - t0) + "ms");
      if (err) {
        reject(err);
      } else {
        accept(obj)
      }
    });
  });
}

exports.compileID = compileID;
exports.compile = compile;
exports.getComp = getComp;
