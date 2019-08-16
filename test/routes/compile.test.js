const bodyParser = require('body-parser');
const express = require('express');
const request = require('supertest');
const routes = require('./../../src/routes');

describe('routes', () => {
  describe('compile', () => {
    let app;
    let compilerError;
    before('Create app', () => {
      compilerError = null;
      app = express();
      app.use(express.json());
      app.use(bodyParser.text());
      app.use(routes.compile(async () => {
        if (compilerError) {
          throw compilerError;
        }
        return 'foo';
      }));
    });

    it('GET / 200 valid body', async () => {
      await request(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .send({item: {lang: 0, code: {}}})
        .expect(200, '"foo"');
    });
    it('POST / 200 valid json body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({item: {lang: 0, code: {}}})
        .expect(200, '"foo"');
    });
    it('POST / 200 valid text body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify({item: {lang: 0, code: {}}}))
        .expect(200, '"foo"');
    });
    it('POST / 400 no body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .expect(400, 'body must contain an item');
    });
    it('POST / 400 empty body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({})
        .expect(400, 'body must contain an item');
    });
    it('POST / 400 item has no code', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({item: {lang: 0}})
        .expect(400, 'item must contain code');
    });
    it('POST / 400 item has no lang', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({item: {code: {}}})
        .expect(400, 'item must specify a language');
    });
    it('POST / 500 compiler throws an error', async () => {
      compilerError = new Error('fake error');
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({item: {lang: 0, code: {}}})
        .expect(500, 'fake error');
    });
  });
});
