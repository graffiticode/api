const { Router } = require('express');
module.exports = () => {
  const router = new Router();
  router.get('/', (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.sendStatus(200);
  });
  return router;
}
