const assert = require('assert');
const { delCache, getCache, setCache } = require('./cache');
const { InvalidArgumentError } = require('./errors');
const { decodeID, encodeID, objectToID, objectFromID } = require('./id');
const { pingLang } = require('./lang');
const { getCompilerHost, getCompilerPort, parseJSON } = require('./util');

const nilID = encodeID([0, 0, 0]);

function getLang(ids, resume) {
  resume(null, 'L' + ids[0]);
}

function getCode(ids, resume) {
  objectFromID(ids[1])
    .then(val => resume(null, val))
    .catch(resume);
}

function getData(ids, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    ids = ids.slice(2);
    assert(ids.length === 3);
    assert(ids[0] === 113);   // L113 code is stored as data not an AST.
    objectFromID(ids[1])
      .then(val => resume(null, val))
      .catch(resume);
  }
}

function compileID(auth, id, options, resume) {
  const refresh = options.refresh;
  if (id === nilID) {
    resume(null, {});
  } else {
    const ids = decodeID(id);
    if (refresh) {
      delCache(id, 'data');
    }
    getCache(id, 'data', (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        getData(ids, (err, data) => {
          getCode(ids, (err, code) => {
            if (err && err.length) {
              resume(err, null);
            } else {
              getLang(ids, (err, lang) => {
                if (err && err.length) {
                  resume(err, null);
                } else {
                  assert(code && code.root !== undefined, 'Invalid code for item ' + ids[1]);
                  // Let downstream compilers know they need to refresh
                  // any data used.
                  comp(auth, lang, code, data, options, (err, obj) => {
                    if (err) {
                      resume(err);
                    } else {
                      // TODO cache id => obj.
                      setCache(lang, id, 'data', obj);
                      resume(null, obj);
                    }
                  });
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
  pingLang(lang, pong => {
    if (pong) {
      // Compile ast to obj.
      const path = '/compile';
      const encodedData = JSON.stringify({
        code: code,
        data: data,
        options: options,
        auth: auth,
      });
      const reqOptions = {
        host: getCompilerHost(lang, global.config),
        port: getCompilerPort(lang, global.config),
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(encodedData),
        },
      };
      const req = global.protocol.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resume(null, parseJSON(data));
        });
        res.on('error', (err) => {
          console.log('[1] comp() ERROR ' + err);
          resume(408);
        });
      });
      req.write(encodedData);
      req.end();
      req.on('error', (err) => {
        console.log('[2] comp() ERROR ' + err);
        resume(408);
      });
    } else {
      resume(404);
    }
  });
}

function verifyCode(code) {
  // Return code if valid, otherwise return null.
  // TODO verify code.
  if (!code) {
    throw new InvalidArgumentError('no code');
  }
  return code;
}

function compile(auth, item) {
  // item = {
  //   lang,
  //   code,
  //   data,
  //   options,
  // }
  // where
  //   lang is an integer language identifier,
  //   code is an AST which may or may not be in the AST store, and
  //   data is a JSON object to be passed with the code to the compiler.
  //   options is an object defining various contextual values.
  return new Promise(async (accept, reject) => {
    try {
      const langID = item.lang;
      const codeID = await objectToID(verifyCode(item.code));
      const dataID = await objectToID(item.data);
      const dataIDs = dataID === 0 && [0] || [113, dataID, 0];  // L113 is the data language.
      const id = encodeID([langID, codeID].concat(dataIDs));
      const options = item.options || {};
      compileID(auth, id, options, (err, obj) => {
        if (err) {
          reject(err);
        } else {
          accept(obj)
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

exports.compileID = compileID;
exports.compile = compile;
