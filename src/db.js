const {parseJSON, cleanAndTrimObj, cleanAndTrimSrc} = require('./utils.js');
const {decodeID, encodeID} = require('./id.js');
var pg = require('pg');

const DEV = process.env.DEV_GRAFFITICODE === 'true' || false;
const LOCAL_DATABASE = process.env.LOCAL_DATABASE === 'true' || false;
if (LOCAL_DATABASE) {
  pg.defaults.ssl = false;
} else {
  pg.defaults.ssl = true;
}

const conStrs = [
  LOCAL_DATABASE ? process.env.DATABASE_URL_LOCAL
    : DEV ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL,
];

function getConStr(id) {
  return conStrs[0];
}

function dbQuery(query) {
  return new Promise((accept, reject) => {
    let conString = getConStr(0);
    pg.connect(conString, function (err, client, done) {
      // If there is an error, client is null and done is a noop
      if (err) {
        console.log("ERROR [1] dbQuery() err=" + err);
        reject(err);
      }
      try {
        client.query(query, function (err, result) {
          done();
          if (err) {
            console.log("[2] dbQuery err=" + err);
            reject(err + ": " + query);
          } else {
            if (!result) {
              result = {
                rows: [],
              };
            }
            return accept(result);
          }
        });
      } catch (e) {
        console.log("ERROR [3] dbQuery() e=" + e);
        done();
        reject(e);
      }
    });
  });
}

function dbQueryAsync(query, resume) {
  dbQuery(query)
    .then(val => {
      resume(null, val)
    })
    .catch(err => {
      console.log("dbQueryAsync() err=" + JSON.stringify(err));
      console.trace();
      resume(err)
    });
}

function updateAST(id, ast, resume) {
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE item SET " +
    "ast='" + ast + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query)
    .then(
      () => {
        resume(null, []);
      })
    .catch(err => {
      if (err && err.length) {
        console.log("ERROR updateAST() err=" + err);
      }
      resume(err, []);
    });
}

function getAST(id, resume) {
  dbQuery("SELECT ast FROM asts WHERE id=" + id)
    .then(val => {
      resume(null, val.rows[0].ast);
    })
    .catch(err => {
      resume(err);
    });
}

// Commit and return commit id
function postItem(language, src, ast, obj, user, parent, img, label, forkID, resume) {
  parent = decodeID(parent)[1];
  // ast is a JSON object
  var forks = 0;
  var views = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var queryStr =
    "INSERT INTO pieces (address, fork_id, user_id, parent_id, views, forks, created, src, obj, language, label, img, ast)" +
    " VALUES ('" + global.clientAddress + "','" + forkID + "','" + user + "','" + parent + " ','" + views + " ','" + forks + "',now(),'" + src + "','" + obj + "','" + language + "','" +
    label + "','" + img + "','" + ast + "');"
  dbQuery(queryStr)
    .then(result => {
      var queryStr = "SELECT * FROM pieces ORDER BY id DESC LIMIT 1";
      return dbQuery(queryStr);
    })
    .then(result => {
      resume(null, result);
      // Do some bookkeeping.
      let codeID = result.rows[0].id;
      forkID = forkID || codeID;
      var queryStr =
        "UPDATE pieces SET " +
        "fork_id=" + forkID + " " +
        "WHERE id=" + codeID;
      dbQuery(queryStr);
      return dbQuery("UPDATE pieces SET forks=forks+1 WHERE id=" + parent);
    })
    .catch(err => {
      console.log("ERROR postItem()");
      resume(err);
    });
}

exports.dbQuery = dbQuery;
exports.dbQueryAsync = dbQueryAsync;
exports.updateAST = updateAST;
exports.cleanAndTrimSrc = cleanAndTrimSrc;
exports.getAST = getAST;
