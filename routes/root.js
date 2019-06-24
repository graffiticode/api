const { Router } = require('express');
module.exports = () => {
  const router = new Router();
  router.get('/', (req, res) => {
    res.sendStatus(200);
  });
  return router;
}
