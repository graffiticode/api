const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, getForm) => {
  const router = new Router();
  router.get('/', (req, res) => {
    getForm(req, res);
  });
  return router;
};
