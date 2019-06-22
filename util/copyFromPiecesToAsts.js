const fs=require('graceful-fs');
const pg = require('pg');
pg.defaults.ssl = true;

load();

function load() {
  var obj = [];
  var hash = {};
  var emptyCount = 0, eraseCount = 0;
  fs.readFile("107dump.gc", 'utf-8', function(err, data) {
    var items = data.split("\n");
    console.log("load() items=" + items);
    insertItems(items, () => {
      console.log("done");
      process.exit(0);
    });
  });
}

function insertItems(items, resume) {
  if (items.length === 0) {
    resume();
  } else {
    let item = items.shift();
    console.log(items.length + ": insertItems() item=" + item);
    insertItem(item, () => {
      insertItems(items, resume);
    });
  }
}

function insertItem(src, resume) {
  var lang = "L107";
  var user = "0";
  var label = "new";
  var queryStr = "SELECT id FROM pieces WHERE language='" + lang + "' AND user_id='" + user + "' AND src = '" + cleanAndTrimSrc(src) + "'";
  dbQuery(queryStr, (err, result) => {
    if (err) {
      console.log("ERROR queryStr=" + queryStr);
      resume(err);
    } else if (result && result.rows.length === 0) {
      var insertStr =
        "INSERT INTO pieces (user_id, parent_id, views, forks, created, src, obj, language, label)" +
        " VALUES ('" + 0 + "', '" + 0 + "', '" + 0 +
        " ', '" + 0 + "', now(), '" + src + "', '" + "" +
        " ', '" + lang + "', '" + label + "');"
      dbQuery(insertStr, function (err, result) {
        console.log("insertItem() result=" + JSON.stringify(result));
        resume(err, []);
      });
    } else {
      resume();
    }
  });
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

const DB = process.env.DATABASE_URL;
function dbQuery(query, resume) {
  pg.connect(DB, function (err, client, done) {
    // If there is an error, client is null and done is a noop
    if (err) {
      console.log("ERROR [1] dbQuery() err=" + err);
      return resume(err, {});
    }
    try {
      client.query(query, function (err, result) {
        done();
        if (err) {
          throw new Error(err + ": " + query);
        }
        if (!result) {
          result = {
            rows: [],
          };
        }
        return resume(err, result);
      });
    } catch (e) {
      console.log("ERROR [2] dbQuery() e=" + e);
      done();
      return resume(e);
    }
  });
};


