
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
  if (config && config.hosts && config.hosts.get(lang)) {
    return config.hosts.get(lang);
  }
  if (config && config.isLocalCompiler) {
    return 'localhost';
  }
  return `${lang}.artcompiler.com`;
}

function getCompilerPort(lang, config) {
  if (config.ports && config.ports.get(lang)) {
    return config.ports.get(lang);
  }
  if (config.isLocalCompiler) {
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



exports.isNonEmptyString = isNonEmptyString;
exports.getCompilerHost = getCompilerHost;
exports.getCompilerPort = getCompilerPort;
exports.parseJSON = parseJSON;
exports.cleanAndTrimObj = cleanAndTrimObj;
exports.cleanAndTrimSrc = cleanAndTrimSrc;
exports.dot2num = dot2num;
exports.num2dot = num2dot;
