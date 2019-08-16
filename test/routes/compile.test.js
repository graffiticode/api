const bodyParser = require('body-parser');
const express = require('express');
const request = require('supertest');
const routes = require('./../../routes');

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
    it('POST / 500 no body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .expect(500, 'Missing item in POST /compile.');
    });
    it('POST / 500 empty body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({})
        .expect(500, 'Missing item in POST /compile.');
    });
    it('POST / 500 item has no code', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({item: {lang: 0}})
        .expect(500, 'Invalid code in POST /compile data.');
    });
    it('POST / 500 item has no lang', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send({item: {code: {}}})
        .expect(500, 'Invalid language identifier in POST /compile data.');
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
