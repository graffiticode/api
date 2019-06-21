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
    "UPDATE pieces SET " +
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

function updateOBJ(id, obj, resume) {
  obj = cleanAndTrimObj(JSON.stringify(obj));
  var query =
    "UPDATE pieces SET " +
    "obj='" + obj + "' " +
    "WHERE id='" + id + "'";
  dbQuery(query)
    .then(val => resume(null, val))
    .catch(err => resume(err));
}

function getItem(itemID, resume) {
  dbQuery("SELECT * FROM pieces WHERE id = " + itemID)
    .then(result => {
      let val;
      if (!result || !result.rows || result.rows.length === 0 || result.rows[0].id < 1000) {
        // Any id before 1000 was experimental
        resume("Bad ID", null);
      } else {
        //assert(result.rows.length === 1);
        val = result.rows[0];
        resume(null, val);
      }
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

function updateItem(id, language, src, ast, obj, img, resume) {
  var views = 0;
  var forks = 0;
  obj = cleanAndTrimObj(obj);
  img = cleanAndTrimObj(img);
  src = cleanAndTrimSrc(src);
  ast = cleanAndTrimSrc(JSON.stringify(ast));
  var query =
    "UPDATE pieces SET " +
    "src='" + src + "'," +
    "ast='" + ast + "'," +
    "obj='" + obj + "'," +
    "img='" + img + "'" +
    "WHERE id='" + id + "'";
  dbQueryAsync(query, function (err) {
    resume(err, []);
  });
}

function getItems(req, res) {
  // Used by L109, L131.
  let userID = req.query.userID;
  let queryStr = "";
  let table = req.query.table || "pieces";
  if (req.query.list) {
    let list = req.query.list;
    queryStr =
      "SELECT * FROM " + table + " WHERE pieces.id" +
      " IN ("+list+") ORDER BY id DESC";
  } else if (req.query.where) {
    let fields = req.query.fields ? req.query.fields : "id";
    let limit = req.query.limit;
    let where = req.query.where;
    queryStr =
      "SELECT " + fields +
      " FROM " + table + " WHERE " + where +
      " ORDER BY id DESC" +
      (limit ? " LIMIT " + limit : "");
  } else {
    console.log("ERROR [1] GET /items");
    res.sendStatus(400);
  }
  dbQueryAsync(queryStr, function (err, result) {
    var rows;
    if (!result || result.rows.length === 0) {
      rows = [];
    } else {
      rows = result.rows;
    }
    let mark = req.query.stat && req.query.stat.mark;
    if (mark !== undefined) {
      dbQueryAsync("SELECT codeid FROM items WHERE " +
              "userid='" + userID +
              "' AND mark='" + mark + "'",
              (err, result) => {
                let list = [];
                result.rows.forEach(row => {
                  list.push(row.codeid);
                });
                let selection = [];
                rows.forEach(row => {
                  if (list.includes(row.id)) {
                    selection.push(row);
                  }
                });
                res.send(selection)
              });
    } else {
      res.send(rows);
    }
  });
  req.on('error', function(e) {
    console.log("[10] ERROR " + e);
    res.sendStatus(400);
  });
}

exports.dbQuery = dbQuery;
exports.dbQueryAsync = dbQueryAsync;
exports.updateAST = updateAST;
exports.updateOBJ = updateOBJ;
exports.getItem = getItem;
exports.postItem = postItem;
exports.updateItem = updateItem;
exports.getItems = getItems;
exports.cleanAndTrimSrc = cleanAndTrimSrc;
