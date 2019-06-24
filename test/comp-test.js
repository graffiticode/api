const { expect } = require('chai');
const { compile } = require('./../src/comp');
const { encodeID, codeToID } = require('./../src/id');
const LOCAL_COMPILES = process.env.LOCAL_COMPILES === 'true' || false;
const http = require('http');
global.config = {
  isLocalCompilers: LOCAL_COMPILES,
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
    it('compiling "hello, world!"', async () => {
      expect(
        await compile(undefined, {
          id: encodeID([0, 2, 0]),
          data: {},
        })).to.equal("hello, world!");
    });
  }).timeout(TIMEOUT_DURATION);
});
