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

exports.dbQuery = dbQuery;
