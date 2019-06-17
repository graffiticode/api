const { Router } = require('express');
module.exports = (auth, getItems) => {
  const router = new Router();
  router.get('/', (req, res) => {
    getItems(req, res);
  });
  return router;
};

