const { expect } = require('chai');
const { decodeID, encodeID, codeToID, codeFromID } = require('./../src/id');
describe('id', () => {
  describe('codeToID', () => {
    it('should return 1 when given {}', () => {
      codeToID({})
        .then(val => {
          expect(val).to.equal(1);
        })
        .catch(val => {
          expect(false).to.equal(true);
        });
    });
  });
  describe('codeFromID', () => {
    it('should return {} when given 1', () => {
      codeFromID(1)
        .then(val => {
          console.log("codeFromID typeof val=" + typeof val);
          expect(val).to.eql({});
        })
        .catch(val => {
          expect(false).to.equal(true);
        });
    });
  });
  describe('decodeID', () => {
    function expectIds(ids, ...params) {
      expect(ids).to.have.length(params.length);
      for (let i = 0; i < ids.length; i++) {
        expect(ids[i]).to.equal(params[i]);
      }
    }
    it('should return 0 when no ID', () => {
      const ids = decodeID();
      expectIds(ids, 0, 0, 0);
    });
    it('should return ID when integer input', () => {
      const ids = decodeID(123);
      expectIds(ids, 0, 123, 0);
    });
    it('should return ID when single ID', () => {
      const ids = decodeID('123456');
      expectIds(ids, 0, 123456, 0);
    });
    it('should return ID with multiple parts', () => {
      const ids = decodeID('123+534653+0');
      expectIds(ids, 123, 534653, 0);
    });
    it('should return 0 ID when invalid ID', () => {
      const ids = decodeID('Px4xO423c');
      expectIds(ids, 0, 0, 0);
    });
    it('should return legacy lang+code+data ID', () => {
      const ids = decodeID('123+123456+0+Px4xO423c');
      expectIds(ids, 0, 123, 113, 123456, 0);
    });
    it('should return 0 ID when multipart invalid ID', () => {
      const ids = decodeID('Px4xO423c+Px4xO423c');
      expectIds(ids, 0, 0, 0);
    });
  });
  describe('encodeID', () => {
    it('should encode single ID', () => {
      const encoded = encodeID([42]);
      expect(encoded).to.equal('z3iqiO');
    });
    it('should encode single zero ID', () => {
      const encoded = encodeID([0]);
      expect(encoded).to.equal('0');
    });
    it('should encode legacy ID', () => {
      const encoded = encodeID([42, 13]);
      expect(encoded).to.equal('J0iKiRaHOcp');
    });
    it('should encode with trailing zeros', () => {
      const encoded = encodeID([42, 0, 0, 0,]);
      expect(encoded).to.equal('QOiVi4OsOi7');
    });
  });
});
