const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, sendData) => {
  const router = new Router();
  router.get('/:id', (req, res) => {
    console.log("GET /data params=" + JSON.stringify(req.params));
    sendData(auth, req.params.id, req, res);
  });
  return router;
};
