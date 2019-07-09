const {getCompilerHost, getCompilerPort} = require('./util');

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
          host: getCompilerHost(lang, global.config),
          port: getCompilerPort(lang, global.config),
          path: "/version",
        };
        try {
          var req = global.protocol.get(options, function(res) {
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
          console.log("ERROR " + e.stack);
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
    host: getCompilerHost(lang, global.config),
    port: getCompilerPort(lang, global.config),
    path: '/'
  };
  req = global.protocol.request(options, function(r) {
    resume(true);
  }).on("error", (e) => {
    console.log("ERROR language unavailable: " + lang);
    resume(false);
  }).end();
}

exports.pingLang = pingLang;
exports.getCompilerVersion = getCompilerVersion;
