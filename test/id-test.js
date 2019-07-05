const { expect } = require('chai');
const { decodeID, encodeID, objectToID, objectFromID } = require('./../src/id');
describe('id', () => {
  describe('objectToID', () => {
    it('should return 1 when given {}', async () => {
      expect(
        await objectToID({})
      ).to.equal(1)
    })
  });
  describe('objectFromID', () => {
    it('getting ID for code {}', async () => {
      expect(
        await objectFromID(1)
      ).to.eql({})
    })
    it('getting code for ID=2', async () => {
      expect(
        await objectFromID(2)
      ).to.eql({
        "1":{"tag":"STR","elts":["hello, world!"]},
        "2":{"tag":"EXPRS","elts":[1]},
        "3":{"tag":"PROG","elts":[2]},
        "root":3,
        "version":"1"})
    })
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
