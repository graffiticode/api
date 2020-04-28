const {getCompilerHost, getCompilerPort} = require('./util');

const pingCache = new Map();
function pingLang(lang, resume) {
  if (pingCache.has(lang) && pingCache.get(lang)) {
    return resume(true);
  }
  const options = {
    method: 'HEAD',
    host: getCompilerHost(lang, global.config),
    port: getCompilerPort(lang, global.config),
    path: '/'
  };
  const req = global.protocol.request(options, (res) => {
    const pong = res.statusCode === 200;
    pingCache.set(lang, pong);
    resume(pong);
  });
  req.on('error', (err) => {
    pingCache.set(lang, false);
    console.log(`ERROR language ${lang} unavailable: ${err.message}`);
    resume(false);
  });
  req.end();
}
exports.pingLang = pingLang;
