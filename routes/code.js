const { Router } = require('express');
const { getCode, putCode } = require('./../src/code.js');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth) => {
  const router = new Router();
  router.get('/', (req, res) => {
    getCode(req, res);
  });
  router.put('/', (req, res) => {
    putCode(req, res);
  });
  return router;
};
