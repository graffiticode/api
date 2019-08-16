const {Router} = require('express');
const {error, parseJSON} = require('../src/util');

function createCompileHandler(compile) {
  return async function (req, res) {
    try {
      if (typeof req.body === 'string') {
        req.body = parseJSON(req.body);
      }
      const {item, auth} = req.body;
      error(item, `Missing item in ${req.method} /compile.`);
      error(!isNaN(parseInt(item.lang)), `Invalid language identifier in ${req.method} /compile data.`);
      error(item.code, `Invalid code in ${req.method} /compile data.`);
      const val = await compile(auth, item);
      res.status(200).json(val);
    } catch(err) {
      res.status(500).send(err.message);
    }
  };
}

module.exports = (compile) => {
  const compileHandler = createCompileHandler(compile);
  const router = new Router();
  router.get('/', compileHandler);
  router.post('/', compileHandler);
  return router;
};
