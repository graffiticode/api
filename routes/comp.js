const { Router } = require('express');
const { getComp } = require('../src/comp');
module.exports = (auth) => {
  const router = new Router();
  router.get('/', (req, res) => {
    getComp(auth, req.query.id, req, res);
  });
  return router;
};
