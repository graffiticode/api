const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("ERROR parsing JSON: " + JSON.stringify(str));
    console.log(e.stack);
    return null;
  }
}

function getCompilerHost(lang, config) {
  if (config && config.hosts && config.hosts[lang]) {
    return config.hosts[lang];
  }
  if (config && config.isLocalCompiles) {
    return 'localhost';
  }
  return `${lang}.artcompiler.com`;
}

function getCompilerPort(lang, config) {
  if (config.ports && config.ports[lang]) {
    return config.ports[lang];
  }
  if (config.isLocalCompiles) {
    return `5${lang.substring(1)}`;
  }
  return '80';
}

function isNonEmptyString(str) {
  return ('string' === typeof(str) && 0 < str.length);
}

function cleanAndTrimObj(str) {
  if (!str) {
    return str;
  }
  str = str.replace(new RegExp("'","g"), "''");
  str = str.replace(new RegExp("\n","g"), " ");
  while(str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

function cleanAndTrimSrc(str) {
  if (!str || typeof str !== "string") {
    return str;
  }
  str = str.replace(new RegExp("'","g"), "''");
  while(str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while(str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}
// From http://javascript.about.com/library/blipconvert.htm
function dot2num(dot) {
  var d = dot.split('.');
  var n = ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}
function num2dot(num) {
  var d = num%256;
  for (var i = 3; i > 0; i--) {
    num = Math.floor(num/256);
    d = num%256 + '.' + d;}
  return d;
}

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
          console.log("[3] ERROR " + e.stack);
          resume(null);
        }
      } else {
        resume(null);
      }
    });
  }
}

function pingLang(lang, resume) {
  let config = {isLocalCompiles: true};
  let options = {
    method: 'HEAD',
    host: getCompilerHost(lang, config),
    port: getCompilerPort(lang, config),
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
exports.getCompilerHost = getCompilerHost;
exports.getCompilerPort = getCompilerPort;
exports.isNonEmptyString = isNonEmptyString;
exports.parseJSON = parseJSON;
exports.cleanAndTrimObj = cleanAndTrimObj;
exports.cleanAndTrimSrc = cleanAndTrimSrc;
exports.dot2num = dot2num;
exports.num2dot = num2dot;
