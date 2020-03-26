const assert = require('assert');
const {Router} = require('express');
const {compile} = require('../comp');
const {error, statusCodeFromErrors, messageFromErrors} = require('../util');
module.exports = () => {
  const router = new Router();
  router.get('/', async (req, res) => {
    try {
      let body = typeof req.body === "string" && JSON.parse(req.body) || req.body;
      let item = body.item;
      error(item, "Missing item in POST /compile.");
      error(!isNaN(parseInt(item.lang)), "Invalid language identifier in POST /compile data.");
      error(item.code, "Invalid code in POST /compile data.");
      let t0 = new Date;
      let val = await compile(auth, item);
      console.log("GET /compile in " + (new Date - t0) + "ms");
      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json(val);
    } catch(err) {
      res.status(500).json(err.message);
    }
  });
  router.post('/', async (req, res) => {
    try {
      let body = typeof req.body === "string" && JSON.parse(req.body) || req.body;
      let item = body.item;
      let auth = body.auth;
      error(item, "Missing item in POST /compile.");
      error(!isNaN(parseInt(item.lang)), "Invalid language identifier in POST /compile data.");
      error(item.code, "Invalid code in POST /compile data.");
      let t0 = new Date;
      let val = await compile(auth, item);
      let refresh = item.options && item.options.refresh;
      const statusCode = val.error && 400 || 200;
      res.set("Access-Control-Allow-Origin", "*");
      res.status(statusCode).json(val);
    } catch(err) {
      res.status(statusCodeFromErrors(err)).json(messageFromErrors(err));
    }
  });
  return router;
};
