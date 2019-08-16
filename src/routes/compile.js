const assert = require('assert');
const {Router} = require('express');
const {parseJSON} = require('./../util');

async function validate(item) {
    assert(item, 'body must contain an item');
    assert(!isNaN(parseInt(item.lang)), `item must specify a language`);
    assert(item.code, `item must contain code`);
}

function createCompileHandler(compile) {
  return async function (req, res) {
    try {
      if (typeof req.body === 'string') {
        req.body = parseJSON(req.body);
      }
      const {auth, item} = req.body;
      await validate(item);
      const val = await compile(auth, item);
      res.status(200).json(val);
    } catch(err) {
      if (err instanceof assert.AssertionError) {
        return res.status(400).send(err.message);
      }
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
