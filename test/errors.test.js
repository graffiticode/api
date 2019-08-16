const assert = require('assert');
const { handleErrorForHTTP, InvalidArgumentError, NotFoundError } = require('./../src/errors');
const sinon = require('sinon');

class FakeResponse {
  constructor() {
    this.status = sinon.fake.returns(this);
    this.sendStatus = sinon.fake();
    this.send = sinon.fake();
  }
}

describe('errors', () => {
  describe('handleErrorForHTTP', () => {
    it('should send 400 for InvalidArgumentError', () => {
      // Arrange
      const res = new FakeResponse();
      const err = new InvalidArgumentError('foo is not a bar');

      // Act
      handleErrorForHTTP(res, err);

      // Assert
      assert(res.status.calledWith(400));
      assert(res.send.calledWith('foo is not a bar'));
    });

    it('should send 400 for NotFoundError', () => {
      // Arrange
      const res = new FakeResponse();
      const err = new NotFoundError('foo does not exist');

      // Act
      handleErrorForHTTP(res, err);

      // Assert
      assert(res.status.calledWith(404));
      assert(res.send.calledWith('foo does not exist'));
    });

    it('should send 500 for generic Error', () => {
      // Arrange
      const res = new FakeResponse();
      const err = new Error('some third party error');

      // Act
      handleErrorForHTTP(res, err);

      // Assert
      assert(res.status.calledWith(500));
      assert(res.send.calledWith('some third party error'));
    });

    it('should send 500 for generic Error no message', () => {
      // Arrange
      const res = new FakeResponse();
      const err = new Error();

      // Act
      handleErrorForHTTP(res, err);

      // Assert
      assert(res.sendStatus.calledWith(500));
      assert(res.status.notCalled);
      assert(res.send.notCalled);
    });

    it('should send 500 for non-Error message', () => {
      // Arrange
      const res = new FakeResponse();
      const err = 'this is just a string error';

      // Act
      handleErrorForHTTP(res, err);

      // Assert
      assert(res.status.calledWith(500));
      assert(res.send.calledWith(err));
    });

    it('should send 500 for non-Error empty message', () => {
      // Arrange
      const res = new FakeResponse();
      const err = '';

      // Act
      handleErrorForHTTP(res, err);

      // Assert
      assert(res.sendStatus.calledWith(500));
      assert(res.status.notCalled);
      assert(res.send.notCalled);
    });
  });
});