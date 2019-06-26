const { expect } = require('chai');
const { compile } = require('./../src/comp');
const { encodeID, codeToID } = require('./../src/id');
const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const http = require('http');
global.config = {
  isLocalCompiles: LOCAL_COMPILES,
};
const TIMEOUT_DURATION = 5000;
global.protocol = http;
describe('comp', () => {
  describe('compile', () => {
    it('mapping an AST to an ID', async () => {
      expect(
        await codeToID({
          "1":{"tag":"STR","elts":["hello, world!"]},
          "2":{"tag":"EXPRS","elts":[1]},
          "3":{"tag":"PROG","elts":[2]},
          "root":3,
          "version":"1"})
      ).to.equal(2);
    });
    it('compiling "hello, world!" from ID', async () => {
      expect(
        await compile(undefined, {
          id: encodeID([0, 2, 0]),
          data: {},
        })).to.equal("hello, world!");
    });
    it('compiling "hello, world!" from code', async () => {
      expect(
        await compile(undefined, {
          lang: 0,
          code: {
            "1":{"tag":"STR","elts":["hello, world!"]},
            "2":{"tag":"EXPRS","elts":[1]},
            "3":{"tag":"PROG","elts":[2]},
            "root":3,
            "lang": 0,
            "version":"1"
          }, data: {},
        })).to.equal("hello, world!");
    });
  }).timeout(TIMEOUT_DURATION);
});
