const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, sendData) => {
  const router = new Router();
  router.get('/', (req, res) => {
    res.sendStatus(200);
  });
  return router;
};
