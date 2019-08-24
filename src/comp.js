const assert = require('assert');
const { delCache, getCache, setCache } = require('./cache');
const { InvalidArgumentError } = require('./errors');
const { decodeID, encodeID, objectToID, objectFromID } = require('./id');
const { pingLang } = require('./lang');
const { getCompilerHost, getCompilerPort, parseJSON, isNonNullObject } = require('./util');

const nilID = encodeID([0, 0, 0]);

async function getLang(ids) {
  return 'L' + ids[0];
}

async function getCode(ids) {
  return await objectFromID(ids[1]);
}

async function getData(ids) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    return {};
  }
  ids = ids.slice(2);
  assert(ids.length === 3);
  assert(ids[0] === 113);   // L113 code is stored as data not an AST.
  return await objectFromID(ids[1]);
}

function comp(auth, lang, code, data, options) {
  return new Promise((resolve, reject) => {
    pingLang(lang, pong => {
      if (!pong) {
        return reject(404);
      }
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
        res.on('end', () => resolve(parseJSON(data)));
        res.on('error', (err) => {
          console.log('[1] comp() ERROR ' + err);
          reject(408);
        });
      });
      req.write(encodedData);
      req.end();
      req.on('error', (err) => {
        console.log('[2] comp() ERROR ' + err);
        reject(408);
      });
    });
  });
}

function compileID(auth, id, options) {
  return new Promise((resolve, reject) => {
    if (id === nilID) {
      return resolve({});
    }
    const refresh = options.refresh;
    if (refresh) {
      delCache(id, 'data');
    }
    const ids = decodeID(id);
    getCache(id, 'data', async (err, val) => {
      if (err) {
        return reject(err);
      }
      if (val) {
        // Got cached value. We're done.
        return resolve(val);
      }
      try {
        const [data, code, lang] = await Promise.all([getData(ids), getCode(ids), getLang(ids)]);
        assert(code && code.root !== undefined, 'Invalid code for item ' + ids[1]);
        // Let downstream compilers know they need to refresh
        // any data used.
        const obj = await comp(auth, lang, code, data, options);
        setCache(lang, id, 'data', obj);
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function verifyCode(code) {
  if (!isNonNullObject(code)) {
    throw new InvalidArgumentError('no code');
  }
  if (!Number.isInteger(code.root)) {
    throw new InvalidArgumentError('invalid code root');
  }
  if (!code.hasOwnProperty(code.root)) {
    throw new InvalidArgumentError('code root does not exist');
  }
  return code;
}

async function compile(auth, item) {
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
  if (!item.hasOwnProperty('lang')) {
    throw new InvalidArgumentError('no lang');
  }
  const langID = item.lang;
  if (!Number.isInteger(langID)) {
    throw new InvalidArgumentError('invalid lang');
  }
  const codeID = await objectToID(verifyCode(item.code));
  const dataID = await objectToID(item.data);
  const dataIDs = dataID === 0 && [0] || [113, dataID, 0];  // L113 is the data language.
  const id = encodeID([langID, codeID].concat(dataIDs));
  const options = item.options || {};
  return await compileID(auth, id, options);
}

exports.compileID = compileID;
exports.compile = compile;
