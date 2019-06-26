const { Router } = require('express');
const { compile } = require('../src/comp');
module.exports = (auth) => {
  const router = new Router();
  router.post('/', (req, res) => {
    let body = typeof req.body === "string" && JSON.parse(req.body) || req.body;
    let item = body.item;
    compile(auth, item)
      .then(val => {
        res.status(200).json(val);
      })
      .catch(err => {
        res.status(500).json({error: err});
      });
  });
  return router;
};
