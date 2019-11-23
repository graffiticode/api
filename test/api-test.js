const request = require('supertest');
const { expect } = require('chai');
const app = require('./../src/app');
describe('api', () => {
  it('GET /', (done) => {
    request(app)
      .get('/')
      .expect(200, 'OK', done);
  });
  it('global.config.unused should be true', () => {
    expect(global.config.unused).to.equal(true);
  });
});

