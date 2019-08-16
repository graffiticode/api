const { handleErrorForHTTP } = require('./../errors');
const { Router } = require('express');
const { parseJSON } = require('./../util');

function createCompileHandler(compile) {
  return async function (req, res) {
    try {
      if (typeof req.body === 'string') {
        req.body = parseJSON(req.body);
      }
      const { auth, item } = req.body;
      const val = await compile(auth, item);
      res.status(200).json(val);
    } catch (err) {
      handleErrorForHTTP(res, err);
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
