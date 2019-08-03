const {getCompilerHost, getCompilerPort} = require('./util');

const pingCache = new Map();
const compilerVersions = new Map();

function getCompilerVersion(lang, resume) {
  // Compiler version tells which parser to use.
  if (compilerVersions.has(lang)) {
    return resume(compilerVersions.get(lang));
  }
  pingLang(lang, (pong) => {
    if (!pong) {
      return resume(null);
    }
    function onError(err) {
      console.log(`ERROR language ${lang} version: ${err.message}`);
      resume(null);
    }
    const options = {
      host: getCompilerHost(lang, global.config),
      port: getCompilerPort(lang, global.config),
      path: '/version',
    };
    const req = global.protocol.get(options, (res) => {
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const str = data.join('');
        const version = parseInt(str.substring(1));
        version = compilerVersions[lang] = isNaN(version) ? 0 : version;
        resume(version);
      })
      res.on('error', onError);
    });
    req.on('error', onError);
    req.end();
  });
}

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
exports.getCompilerVersion = getCompilerVersion;
