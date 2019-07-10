const {Router} = require('express');
const {pingLang} = require('../src/lang');
module.exports = () => {
  const router = new Router();
  router.get('/', (req, res) => {
    if (isNaN(parseInt(req.query.id))) {
      res.sendStatus(400);
    } else {
      let lang = "L" + req.query.id;
      pingLang(lang, val => {
        if (val) {
          res.sendStatus(200);
        } else {
          res.sendStatus(400);
        }
      });
    }
  });
  router.get('/:file', (req, res) => {
    console.log("GET /:path params=" + JSON.stringify(req.params));
    console.log("GET /:path baseUrl=" + req.baseUrl);
    if (isNaN(parseInt(req.query.id))) {
      res.sendStatus(400);
    } else {
      let lang = "L" + req.query.id;
      pingLang(lang, val => {
        if (val) {
          res.sendStatus(200);
        } else {
          res.sendStatus(400);
        }
      });
    }
  });
  return router;
}
