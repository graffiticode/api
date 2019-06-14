const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, sendData) => {
  const router = new Router();
  router.get('/', (req, res) => {
    console.log("GET /data query.id=" + req.query.id);
    console.log("GET /data params=" + JSON.stringify(req.params));
    sendData(auth, req.query.id, req, res);
  });
  return router;
};
