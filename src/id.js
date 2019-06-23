const assert = require('assert');
const Hashids = require('hashids');
const {dbQuery, cleanAndTrimSrc} = require('./db.js');

const hashids = new Hashids('Art Compiler LLC');  // This string shall never change!

function decodeID(id) {
  // console.log('[1] decodeID() >> ' + id);
  // 123456, 123+534653+0, Px4xO423c, 123+123456+0+Px4xO423c, Px4xO423c+Px4xO423c
  if (id === undefined) {
    id = '0';
  }
  if (Number.isInteger(id)) {
    id = '' + id;
  }
  if (Array.isArray(id)) {
    // Looks like it is already decoded.
    assert(Number.isInteger(id[0]) && Number.isInteger(id[1]));
    return id;
  }
  assert(typeof id === 'string', 'Invalid id ' + id);
  id = id.replace(/\+/g, ' ');
  let parts = id.split(' ');
  let ids = [];
  // Concatenate the first two integer ids and the last hash id. Everything
  // else gets erased. This is to enable updating the dataID.
  for (let i = 0; i < parts.length; i++) {
    let n;
    if (ids.length > 2) {
      // Found the head, now skip to the last part to get the tail.
      ids = ids.slice(0, 2);
      i = parts.length - 1;
    }
    if (Number.isInteger(n = +parts[i])) {
      ids.push(n);
    } else {
      ids = ids.concat(hashids.decode(parts[i]));
    }
  }
  // Fix short ids.
  if (ids.length === 0) {
    ids = [0, 0, 0]; // Invalid id
  } else if (ids.length === 1) {
    ids = [0, ids[0], 0];
  } else if (ids.length === 2) {
    // Legacy code+data
    ids = [0, ids[0], 113, ids[1], 0];
  } else if (ids.length === 3 && ids[2] !== 0) {
    // Legacy lang+code+data
    ids = [ids[0], ids[1], 113, ids[2], 0];
  }
  // console.log('[2] decodeID() << ' + JSON.stringify(ids));
  return ids;
}

function encodeID(ids) {
  // console.log('[1] encodeID() >> ' + JSON.stringify(ids));
  let length = ids.length;
  if (length >= 3 &&
      // [0,0,0] --> '0'
      +ids[length - 3] === 0 &&
      +ids[length - 2] === 0 &&
      +ids[length - 1] === 0) {
    ids = ids.slice(0, length - 2);
    length = ids.length;
  }
  if (length === 1) {
    if (+ids[0] === 0) {
      return '0';
    }
    ids = [0, +ids[0], 0];
  } else if (length === 2) {
    ids = [0, +ids[0], 113, +ids[1], 0];
  }
  let id = hashids.encode(ids);
  // console.log('[2] encodeID() << ' + id);
  return id;
}

function codeToID(code) {
  return new Promise((accept, reject) => {
    let ast = cleanAndTrimSrc(JSON.stringify(code));
    let sql = "SELECT id FROM asts WHERE ast='" + ast + "';";
    dbQuery(sql)
      .then(val => {
        if (val.rows.length) {
          accept(+val.rows[0].id || 0);
        } else {
          let sql = "INSERT INTO asts (ast) VALUES ('" + ast + "');"
          dbQuery(sql)
            .then(val => {
              accept(+val.rows[0].id);
            })
            .catch (err => {
              reject(err);
            });
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function codeFromID(id) {
  return new Promise((accept, reject) => {
    let sql = "SELECT ast FROM asts WHERE id='" + id + "';";
    dbQuery(sql)
      .then(val => {
        accept(val.rows[0].ast);
      })
      .catch(err => {
        console.log("codeFromID() id=" + id + " err=" + JSON.stringify(err));
        reject(err);
      });
  });
}

module.exports.decodeID = decodeID;
module.exports.encodeID = encodeID;
module.exports.codeToID = codeToID;
module.exports.codeFromID = codeFromID
