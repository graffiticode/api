const assert = require('assert');
const { Router } = require('express');
const { compile } = require('../src/comp');
module.exports = (auth) => {
  const router = new Router();
  router.post('/', async (req, res) => {
    try {
      let body = typeof req.body === "string" && JSON.parse(req.body) || req.body;
      let item = body.item;
      if (!item || !item.lang || !item.code) {
        res.status(500).json("Invalid data in POST /compile");
      } else {
        let val = await compile(auth, item);
        res.status(200).json(val);
      }
    } catch(err) {
      console.log(JSON.stringify(err, null, 2));
      res.status(500).json(err);
    }
  });
  return router;
};
