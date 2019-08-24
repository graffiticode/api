const { expect } = require('chai');
const { compile } = require('./../src/comp');
const { InvalidArgumentError } = require('./../src/errors');
const { objectToID, clearCache } = require('./../src/id');

const TIMEOUT_DURATION = 5000;

describe('comp', function () {
  this.timeout(TIMEOUT_DURATION);
  describe('compile', () => {
    it('mapping an AST to an ID', async () => {
      expect(
        await objectToID({
          "1": { "tag": "STR", "elts": ["hello, world!"] },
          "2": { "tag": "EXPRS", "elts": [1] },
          "3": { "tag": "PROG", "elts": [2] },
          "root": 3,
          "version": "1"
        })
      ).to.equal(2);
    });
    it('compiling L0 "hello, world!" from code', async () => {
      expect(
        await compile(undefined, {
          lang: 0,
          code: {
            "1": { "tag": "STR", "elts": ["hello, world!"] },
            "2": { "tag": "EXPRS", "elts": [1] },
            "3": { "tag": "PROG", "elts": [2] },
            "root": 3,
            "lang": 0,
            "version": "1"
          }, data: {},
        })).to.equal("hello, world!");
    });
    it('compiling L0 "hello, world!" from code [cache]', async () => {
      expect(
        await compile(undefined, {
          lang: 0,
          code: {
            "1": { "tag": "STR", "elts": ["hello, world!"] },
            "2": { "tag": "EXPRS", "elts": [1] },
            "3": { "tag": "PROG", "elts": [2] },
            "root": 3,
            "lang": 0,
            "version": "1"
          }, data: {},
        })).to.equal("hello, world!");
    });
    it('compiling L107 sample from code', async () => {
      expect(
        await compile(undefined, {
          lang: 107,
          code: {
            "1": { "tag": "IDENT", "elts": ["rubric"] },
            "2": { "tag": "IDENT", "elts": ["symbolic"] },
            "3": { "tag": "STR", "elts": [" \\frac{3x^3+22x^2+38x+15}{x+5}"] },
            "4": { "tag": "LIST", "elts": [2, 3] },
            "5": { "tag": "IDENT", "elts": ["in"] },
            "6": { "tag": "STR", "elts": ["3x^2+7x+3"] },
            "7": { "tag": "LIST", "elts": [6] },
            "8": { "tag": "EXPRS", "elts": [1, 4, 5, 7] },
            "9": { "tag": "IN", "elts": [7] },
            "10": { "tag": "IDENT", "elts": ["IN"] },
            "11": { "tag": "SYMBOLIC", "elts": [3] },
            "12": { "tag": "IDENT", "elts": ["SYMBOLIC"] },
            "13": { "tag": "LIST", "elts": [11] },
            "14": { "tag": "RUBRIC", "elts": [13, 9] },
            "15": { "tag": "IDENT", "elts": ["RUBRIC"] },
            "16": { "tag": "EXPRS", "elts": [14] },
            "17": { "tag": "PROG", "elts": [16] },
            "root": 17,
            "lang": 107,
            "version": "0"
          }, data: {},
        })).to.eql({
          "input": [
            "3x^2+7x+3"
          ],
          "score": [
            {
              "input": "3x^2+7x+3",
              "result": true,
              "validation": {
                "method": "symbolic",
                "result": true,
                "settings": {
                  "strict": true
                },
                "type": "method",
                "value": " \\frac{3x^3+22x^2+38x+15}{x+5}"
              }
            }
          ]
        });
    });
  });

  describe('validate', () => {
    beforeEach(async () => await clearCache());
    it('should throw InvalidArgumentError if no lang', async () => {
      try {
        await compile(null, {});
        throw new Error('compile should have failed');
      } catch (error) {
        expect(error).to.be.instanceOf(InvalidArgumentError);
        expect(error.message).to.equal('no lang');
      }
    });
    it('should throw InvalidArgumentError if invalid lang', async () => {
      try {
        const lang = 'foo';
        await compile(null, { lang });
        throw new Error('compile should have failed');
      } catch (error) {
        expect(error).to.be.instanceOf(InvalidArgumentError);
        expect(error.message).to.equal('invalid lang');
      }
    });
    it('should throw InvalidArgumentError if no code', async () => {
      try {
        const lang = 0;
        const data = {};
        await compile(null, { lang, data });
        throw new Error('compile should have failed');
      } catch (error) {
        expect(error).to.be.instanceOf(InvalidArgumentError);
        expect(error.message).to.equal('no code');
      }
    });
    it('should throw InvalidArgumentError if root is not a number', async () => {
      try {
        const lang = 0;
        const code = { root: 'foo' };
        const data = {};
        await compile(null, { lang, code, data });
        throw new Error('compile should have failed');
      } catch (error) {
        expect(error).to.be.instanceOf(InvalidArgumentError);
        expect(error.message).to.equal('invalid code root');
      }
    });
    it('should throw InvalidArgumentError if root does not exist', async () => {
      try {
        const lang = 0;
        const code = { root: 3 };
        const data = {};
        await compile(null, { lang, code, data });
        throw new Error('compile should have failed');
      } catch (error) {
        expect(error).to.be.instanceOf(InvalidArgumentError);
        expect(error.message).to.equal('code root does not exist');
      }
    });
  });
});
