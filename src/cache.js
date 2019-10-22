const cache = null; // = redis.createClient(process.env.REDIS_URL);
const DEBUG = process.env.DEBUG_GRAFFITICODE === 'true' || false;

const localCache = new Map();
const dontCache = ["L124"];

function delCache (id, type) {
  let key = id + type;
  localCache.delete(key);
  if (cache) {
    cache.del(key);
  }
}

const MAX_SIZE = 4000;
const FLUSH_SIZE = Math.floor(MAX_SIZE * .25)
function resizeLocalCache () {
  let size = localCache.size;
  let keys = localCache.keys();
  for (; size > MAX_SIZE - FLUSH_SIZE; size--) {
    let key = keys.next().value;
    console.log("Deleting key " + key);
    localCache.delete(key);
  }
}

function getCache (id, type, resume) {
  let key = id + type;
  let val;
  if ((val = localCache.get(key))) {
    resume(null, val);
  } else if (cache) {
    cache.get(key, (err, val) => {
      resume(null, type === "data" ? parseJSON(val) : val);
    });
  } else {
    resume(null, null);
  }
}

function setCache (lang, id, type, val) {
  if (!DEBUG && !dontCache.includes(lang)) {
    if (localCache.size >= MAX_SIZE) {
      resizeLocalCache();
    }
    let key = id + type;
    localCache.set(key, val);
    if (cache) {
      cache.set(key, type === "data" ? JSON.stringify(val) : val);
    }
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

exports.delCache = delCache;
exports.getCache = getCache;
exports.setCache = setCache;
exports.renCache = renCache;
