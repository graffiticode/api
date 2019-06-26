const request = require('supertest');
const { expect } = require('chai');
const app = require('./../app');
describe('api', () => {
  it('GET /', (done) => {
    request(app)
      .get('/')
      .expect(200, 'OK', done);
  });
});

