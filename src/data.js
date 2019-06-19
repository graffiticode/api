const {decodeID, encodeID} = require('./id.js');
const {dbQueryAsync, postItem, updateItem} = require('./db.js');
const {compileID} = require('./comp.js');

function getData(auth, id, req, res) {
  let ids = decodeID(id);
  let refresh = !!req.query.refresh;
  let dontSave = !!req.query.dontSave;
  let options = {
    refresh: refresh,
    dontSave: dontSave,
  };
  let t0 = new Date;
  compileID(auth, id, options, (err, obj) => {
    if (err) {
      console.log("ERROR GET /data?id=" + ids.join("+") + " (" + id + ") err=" + err);
      res.sendStatus(400);
    } else {
      console.log("GET /data?id=" + ids.join("+") + " (" + id + ") in " +
                  (new Date - t0) + "ms" + (refresh ? " [refresh]" : ""));
      res.json(obj);
    }
  });
}

function putData(auth, data, resume) {
  if (!data || !Object.keys(data).length) {
    resume(null, undefined);
    return;
  }
  let t0 = new Date;
  let rawSrc = JSON.stringify(data) + "..";
  let src = cleanAndTrimSrc(rawSrc);
  let obj = JSON.stringify(data);
  let lang = "L113";
  let user = 0;
  // FIXME search for AST
  let query =
    "SELECT * FROM pieces WHERE language='" + lang +
    "' AND src='" + src + "' LIMIT 1";
  dbQueryAsync(query, function(err, result) {
    // See if there is already an item with the same source for the same
    // language. If so, pass it on.
    var row = result.rows[0];
    let itemID = row && row.id ? row.id : undefined;
    // Might still be undefined if there is no match.
    if (itemID) {
      var src = row.src;
      var ast = row.ast;
      var img = row.img;
      var label = row.label;
      updateItem(itemID, lang, rawSrc, ast, obj, img, function (err, data) {
        if (err) {
          console.log("[8] ERROR " + err);
        }
      });
      // Don't wait for update. We have what we need to respond.
      let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
      let codeID = row.id;
      let dataID = 0;
      let ids = [langID, codeID, dataID];
      let id = encodeID(ids);
      resume(null, id);
    } else {
      var ast = null;
      var label = "data";
      var parent = 0;
      var img = "";
      let forkID = 0;
      postItem(lang, rawSrc, ast, obj, user, parent, img, label, forkID, (err, result) => {
        let langID = lang.charAt(0) === "L" ? +lang.substring(1) : +lang;
        let codeID = result.rows[0].id;
        let dataID = 0;
        let ids = [langID, codeID, dataID];
        let id = encodeID(ids);
        if (err) {
          console.log("ERROR putData() err=" + err);
          resume(err);
        } else {
          resume(null, id);
        }
      });
    }
  });
}

exports.getData = getData;
exports.putData = putData;
