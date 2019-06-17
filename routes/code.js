const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, getCode, putCode) => {
  const router = new Router();
  router.get('/', (req, res) => {
    getCode(req, res);
  });
  router.put('/', (req, res) => {
    putCode(req, res);
  });
  return router;
};
