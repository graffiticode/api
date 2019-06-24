const {Router} = require('express');
const {pingLang} = require('../src/lang');
module.exports = () => {
  const router = new Router();
  router.get('/:lang', (req, res) => {
    getLang(req.params.lang, res);
  });
  router.get('/', (req, res) => {
    getLang(req.query.id, res);
  });
  function getLang(lang, res) {
    if (!isNaN(parseInt(lang))) {
      lang = "L" + lang;
    }
    if (!lang) {
      res.sendStatus(400);
    } else {
      pingLang(lang, val => {
        if (val) {
          res.sendStatus(200);
        } else {
          res.sendStatus(400);
        }
      });
    }
  }
  return router;
}
