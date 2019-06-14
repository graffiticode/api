const { Router } = require('express');
const { isNonEmptyString } = require('./../src/utils');
module.exports = (auth, sendForm) => {
  const router = new Router();
  router.get('/', (req, res) => {
    sendForm(req.query.id, req, res);
  });
  return router;
};
