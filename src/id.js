const assert = require('assert');
const Hashids = require('hashids');

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

function dumpMap(map) {
  map.forEach((val, key) => {
    console.log(JSON.stringify(key) + " => " + JSON.stringify(val))
  });
}

const objIDMap = new Map([[JSON.stringify({}), 1]]);
const idObjMap = new Map([[1, {}]]);

async function clearCache() {
  objIDMap.clear();
  idObjMap.clear();
}

async function objectToID(obj) {
  let id;
  if (obj === null) {
    id = 0;
  } else {
    const key = JSON.stringify(obj);
    if (!objIDMap.has(key)) {
      let id = idObjMap.size + 1;
      objIDMap.set(key, id);
      idObjMap.set(id, obj);
    }
    id = objIDMap.get(key);
  }
  return id;
}

async function objectFromID(id) {
  return idObjMap.get(id);
}

module.exports.decodeID = decodeID;
module.exports.encodeID = encodeID;
module.exports.objectToID = objectToID;
module.exports.objectFromID = objectFromID;
module.exports.clearCache = clearCache;
