const { Router } = require('express');
module.exports = () => {
  const router = new Router();
  router.get('/', (req, res) => {
    console.log("GET /");
    res.sendStatus(200);
  });
  return router;
}
