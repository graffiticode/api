const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');

module.exports = (dbQuery) => {
  const router = new Router();
  // Get a stat  
  router.get('/', (req, res) => {
    const { id } = req.query;
    if (!id) {
      return res.sendStatus(400);
    }
    dbQuery(`SELECT mark FROM items WHERE itemID='${id}'`, (err, result) => {
      if (err) {
        return res.sendStatus(500);
      }
      res.status(200).json(result.rows);
    });
  });
  // Update a stat
  router.put('/', (req, res) => {
    let { userID, itemID, mark } = req.body;
    if (!isNonEmptyString(userID)) {
      return res.sendStatus(400);
    }
    if (!isNonEmptyString(itemID)) {
      return res.sendStatus(400);
    }
    if (typeof (mark) !== 'string') {
      return res.sendStatus(400);
    }
    mark = mark === '' ? 'null' : `'${mark}'`;
    insertItem(userID, itemID, (err) => {
      if (err) {
        return res.sendStatus(500);
      }
      const query = `UPDATE items SET mark=${mark} WHERE itemID='${itemID}'`;
      dbQuery(query, (err, result) => {
        if (err) {
          return res.sendStatus(500);
        }
        res.sendStatus(200);
      });
    });
  });
  return router;
  function insertItem(userID, itemID, resume) {
    dbQuery("SELECT count(*) FROM items where userID=" + userID + "AND itemID='" + itemID + "'", (err, result) => {
      if (+result.rows[0].count === 0) {
        let [langID, codeID, ...dataID] = decodeID(itemID);
        dataID = encodeID(dataID);
        dbQuery("INSERT INTO items (userID, itemID, langID, codeID, dataID) " +
                "VALUES (" + userID + ", '" + itemID + "', " + langID + ", " + codeID + ", '" + dataID + "') ",
                (err, result) => {
                  resume();
                });
      } else {
        resume();
      }
    });
  }
};
