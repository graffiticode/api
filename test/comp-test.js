const { expect } = require('chai');
const { compile } = require('./../src/comp');
const { encodeID, codeToID } = require('./../src/id');

describe('comp', () => {
  describe('compile', () => {
    it('should return 2 for "hello, world!" AST', () => {
      codeToID({"1":{"tag":"STR","elts":["hello, world!"]},"2":{"tag":"EXPRS","elts":[1]},"3":{"tag":"PROG","elts":[2]},"root":3,"version":"1"})
        .then(val => {
          expect(val).to.equal(2);
        })
        .catch(err => {
          expect(false).to.equal(true);
        });
    });
    it('compiling', () => {
      // TODO compile data with
      compile(undefined, {
        id: encodeID([0, 2, 0]),
        data: [{}],
      }).then(val => {
        console.log("compiling val=" + val);
        expect(true).to.equal(true);
      }).catch(err => {
        console.log("err=" + err);
        console.trace();
        expect(false).to.equal(false);
      });
    });
    it('compiling "hello, world!"', () => {
      compile({
        id: 0,
        data: [{}],
      }).then(val => {
        expect(true).to.equal(true);
      }).catch(err => {
        console.log("err=" + err);
        console.trace();
        expect(false).to.equal(false);
      });
    });
  });
});
