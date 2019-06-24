const cache = null; // = redis.createClient(process.env.REDIS_URL);
const DEBUG = process.env.DEBUG_GRAFFITICODE === 'true' || false;

const localCache = {};
const dontCache = ["L124"];

function delCache (id, type) {
  let key = id + type;
  delete localCache[key];
  if (cache) {
    cache.del(key);
  }
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

function setCache (lang, id, type, val) {
  if (!DEBUG && !dontCache.includes(lang)) {
    let key = id + type;
    localCache[key] = val;
    if (cache) {
      cache.set(key, type === "data" ? JSON.stringify(val) : val);
    }
  }
}

function clrCache (type, items) {
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

exports.delCache = delCache;
exports.getCache = getCache;
exports.setCache = setCache;
exports.clrCache = clrCache;
exports.renCache = renCache;
