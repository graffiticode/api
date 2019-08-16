const bodyParser = require('body-parser');
const { InvalidArgumentError, NotFoundError, } = require('./../../src/errors');
const express = require('express');
const request = require('supertest');
const routes = require('./../../src/routes');

const DEFAULT_REQUEST = {
  item: {
    lang: 0,
    code: {
      src: '\'Hello, Compiler\'..',
      ast: {
        '1': {
          tag: 'STR',
          elts: ['Hello, Compiler'],
        },
        '2': {
          tag: 'EXPRS',
          elts: [1],
        },
        '3': {
          tag: 'PROG',
          elts: [2],
        },
        root: 3,
      },
    },
    data: {
      foo: 'bar',
    },
    options: {
      cache: false,
    },
  },
};

describe('routes', () => {
  describe('compile', () => {
    let app;
    let compilerError;
    before('Create app', () => {
      // TODO(kevindy) use the app directly
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
        .send(DEFAULT_REQUEST)
        .expect(200, '"foo"');
    });
    it('POST / 200 valid body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(DEFAULT_REQUEST)
        .expect(200, '"foo"');
    });
    it('POST / 200 valid string body', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(DEFAULT_REQUEST))
        .expect(200, '"foo"');
    });
    it('POST / 500 if compiler throws an error', async () => {
      compilerError = new Error('fake error');
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(DEFAULT_REQUEST)
        .expect(500, 'fake error');
    });
    it('POST / 400 compiler if throws an invalid argument error', async () => {
      compilerError = new InvalidArgumentError('fake error');
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(DEFAULT_REQUEST)
        .expect(400, 'fake error');
    });
    it('POST / 404 compiler if throws an not found error', async () => {
      compilerError = new NotFoundError('fake error');
      await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(DEFAULT_REQUEST)
        .expect(404, 'fake error');
    });
  });
});
