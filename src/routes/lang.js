const {Router} = require('express');
const {pingLang} = require('./../lang');
const {getCompilerHost, getCompilerPort} = require('./../util');
module.exports = () => {
  const router = new Router();
  router.get('/', (req, res) => {
    let [unused, base, path] = req.baseUrl.split("/");
    let id =
      base === "lang" && req.query.id ||
      base.indexOf("L") === 0 && base.slice(1);
    if (isNaN(parseInt(id))) {
      res.sendStatus(400);
    } else {
      let lang = "L" + id;
      pingLang(lang, pong => {
        if (pong) {
          if (path === undefined) {
            res.sendStatus(200);
          } else {
            let data = [];
            let config = global.config;
            let options = {
              host: getCompilerHost(lang, config),
              port: getCompilerPort(lang, config),
              path: "/" + path,
            };
            req = protocol.get(options, function(res2) {
              res2.on("data", function (chunk) {
                data.push(chunk);
              }).on("end", function () {
                res.send(data.join(""));
              });
            });
          }
        } else {
          res.sendStatus(404);
        }
      });
    }
  });
  return router;
}
