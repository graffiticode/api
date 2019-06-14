const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, sendData) => {
  const router = new Router();
  router.get('/', (req, res) => {
    sendCode(req.query.id, req, res);
  });
  return router;
};
